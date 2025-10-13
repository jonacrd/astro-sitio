-- ============================================
-- FIX CRÍTICO: Solución de Race Conditions
-- ============================================
-- Este script corrige los problemas de concurrencia
-- detectados en el sistema de pedidos.
--
-- PROBLEMA: Múltiples usuarios comprando al mismo vendedor
-- simultáneamente pueden causar sobreventa por race conditions.
--
-- SOLUCIÓN: SELECT FOR UPDATE + Transacciones explícitas
-- ============================================

-- 1. FUNCIÓN CORREGIDA: place_order con locks
CREATE OR REPLACE FUNCTION place_order_safe(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_total_cents INTEGER;
  v_points_added INTEGER;
  v_cart_id UUID;
  v_cart_item RECORD;
  v_seller_product RECORD;
BEGIN
  -- INICIO DE TRANSACCIÓN EXPLÍCITA
  -- PostgreSQL funciones ya están en transacción, pero lo hacemos explícito
  
  -- 1. Verificar que el usuario tiene un carrito para este vendedor
  SELECT id INTO v_cart_id
  FROM carts
  WHERE user_id = p_user_id
    AND seller_id = p_seller_id;
  
  IF v_cart_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No hay carrito para este vendedor'
    );
  END IF;

  -- 2. Verificar que el carrito tiene items
  IF NOT EXISTS (
    SELECT 1 FROM cart_items 
    WHERE cart_id = v_cart_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El carrito está vacío'
    );
  END IF;

  -- 3. Calcular total y verificar stock CON LOCKS
  v_total_cents := 0;
  
  -- 🔒 CRITICAL: Lock de las filas de seller_products ANTES de leer
  FOR v_cart_item IN 
    SELECT 
      ci.product_id,
      ci.title,
      ci.qty,
      ci.price_cents as cart_price_cents,
      sp.id as seller_product_id,
      sp.stock,
      sp.price_cents as seller_price_cents
    FROM cart_items ci
    INNER JOIN seller_products sp 
      ON sp.product_id = ci.product_id 
      AND sp.seller_id = p_seller_id
    WHERE ci.cart_id = v_cart_id
    FOR UPDATE OF sp  -- 🔒 LOCK EXPLÍCITO: Nadie más puede modificar estos productos
  LOOP
    -- Verificar stock disponible (ahora con lock, es seguro)
    IF v_cart_item.stock IS NULL OR v_cart_item.stock < v_cart_item.qty THEN
      -- Rollback automático al hacer RETURN en función
      RETURN json_build_object(
        'success', false,
        'error', 'Stock insuficiente para el producto: ' || v_cart_item.title || ' (disponible: ' || COALESCE(v_cart_item.stock, 0) || ', solicitado: ' || v_cart_item.qty || ')'
      );
    END IF;
    
    -- Usar precio del vendedor si está disponible
    IF v_cart_item.seller_price_cents IS NOT NULL THEN
      v_total_cents := v_total_cents + (v_cart_item.seller_price_cents * v_cart_item.qty);
    ELSE
      v_total_cents := v_total_cents + (v_cart_item.cart_price_cents * v_cart_item.qty);
    END IF;
  END LOOP;

  -- 4. Crear la orden
  INSERT INTO orders (
    user_id,
    seller_id,
    total_cents,
    payment_method,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_seller_id,
    v_total_cents,
    p_payment_method,
    'pending',
    NOW()
  ) RETURNING id INTO v_order_id;

  -- 5. Crear items de la orden y actualizar stock ATÓMICAMENTE
  FOR v_cart_item IN 
    SELECT 
      ci.product_id,
      ci.title,
      ci.qty,
      ci.price_cents as cart_price_cents,
      sp.id as seller_product_id,
      sp.price_cents as seller_price_cents
    FROM cart_items ci
    INNER JOIN seller_products sp 
      ON sp.product_id = ci.product_id 
      AND sp.seller_id = p_seller_id
    WHERE ci.cart_id = v_cart_id
  LOOP
    -- Insertar item de la orden
    INSERT INTO order_items (
      order_id,
      product_id,
      title,
      price_cents,
      qty,
      created_at
    ) VALUES (
      v_order_id,
      v_cart_item.product_id,
      v_cart_item.title,
      COALESCE(v_cart_item.seller_price_cents, v_cart_item.cart_price_cents),
      v_cart_item.qty,
      NOW()
    );

    -- 🔒 Actualizar stock del vendedor (las filas ya están lockeadas)
    UPDATE seller_products 
    SET 
      stock = stock - v_cart_item.qty,
      updated_at = NOW()
    WHERE id = v_cart_item.seller_product_id;
  END LOOP;

  -- 6. Limpiar el carrito
  DELETE FROM cart_items WHERE cart_id = v_cart_id;
  DELETE FROM carts WHERE id = v_cart_id;

  -- 7. Calcular puntos (1 punto por cada $100)
  v_points_added := v_total_cents / 10000; -- 10000 centavos = $100

  -- 8. Actualizar puntos del usuario (si existe tabla de puntos)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_points') THEN
    INSERT INTO user_points (user_id, points, source, order_id, created_at, updated_at)
    VALUES (p_user_id, v_points_added, 'order', v_order_id, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET 
      points = user_points.points + EXCLUDED.points,
      updated_at = NOW();
  END IF;

  -- 9. Retornar resultado exitoso
  RETURN json_build_object(
    'success', true,
    'orderId', v_order_id,
    'totalCents', v_total_cents,
    'pointsAdded', v_points_added
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, PostgreSQL hace rollback automático
    RAISE WARNING 'Error en place_order_safe: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'Error procesando la orden: ' || SQLERRM
    );
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION place_order_safe(UUID, UUID, TEXT) TO authenticated;

-- ============================================
-- 2. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

-- Optimizar búsqueda de carrito por usuario y vendedor
CREATE INDEX IF NOT EXISTS idx_carts_user_seller 
  ON carts(user_id, seller_id);

-- Optimizar búsqueda de items por carrito
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id 
  ON cart_items(cart_id);

-- Optimizar join entre cart_items y seller_products
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id 
  ON cart_items(product_id);

-- Optimizar búsqueda de productos activos por vendedor
CREATE INDEX IF NOT EXISTS idx_seller_products_seller_active 
  ON seller_products(seller_id, active) 
  WHERE active = true;

-- Optimizar búsqueda de productos por seller y product
CREATE INDEX IF NOT EXISTS idx_seller_products_seller_product 
  ON seller_products(seller_id, product_id);

-- ============================================
-- 3. FUNCIÓN AUXILIAR: Verificar Stock
-- ============================================

CREATE OR REPLACE FUNCTION check_stock_availability(
  p_seller_id UUID,
  p_product_id TEXT,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  SELECT stock INTO v_current_stock
  FROM seller_products
  WHERE seller_id = p_seller_id
    AND product_id = p_product_id
    AND active = true;
  
  RETURN v_current_stock IS NOT NULL AND v_current_stock >= p_quantity;
END;
$$;

-- ============================================
-- 4. VISTA: Monitoring de Stock Bajo
-- ============================================

CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  sp.seller_id,
  p.id as product_id,
  p.title as product_name,
  sp.stock,
  sp.price_cents,
  sp.active,
  au.email as seller_email
FROM seller_products sp
INNER JOIN products p ON p.id = sp.product_id
INNER JOIN auth.users au ON au.id = sp.seller_id
WHERE sp.active = true
  AND sp.stock <= 5
  AND sp.stock > 0
ORDER BY sp.stock ASC, sp.seller_id;

-- ============================================
-- 5. FUNCIÓN: Actualizar Stock Manual
-- ============================================

CREATE OR REPLACE FUNCTION update_seller_product_stock(
  p_seller_id UUID,
  p_product_id TEXT,
  p_new_stock INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_stock INTEGER;
  v_updated_rows INTEGER;
BEGIN
  -- Verificar que el vendedor es el dueño
  IF auth.uid() != p_seller_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No autorizado'
    );
  END IF;

  -- Actualizar stock con lock
  UPDATE seller_products
  SET 
    stock = p_new_stock,
    updated_at = NOW()
  WHERE seller_id = p_seller_id
    AND product_id = p_product_id
  RETURNING stock INTO v_old_stock;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  IF v_updated_rows = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Producto no encontrado'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'old_stock', v_old_stock,
    'new_stock', p_new_stock
  );
END;
$$;

-- ============================================
-- 6. TRIGGER: Logging de Cambios de Stock
-- ============================================

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS stock_changes_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  old_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  change_type TEXT NOT NULL, -- 'sale', 'manual', 'restock'
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_stock_changes_seller_product 
  ON stock_changes_log(seller_id, product_id, created_at DESC);

-- Función del trigger
CREATE OR REPLACE FUNCTION log_stock_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.stock != NEW.stock THEN
    INSERT INTO stock_changes_log (
      seller_id,
      product_id,
      old_stock,
      new_stock,
      change_type,
      changed_by
    ) VALUES (
      NEW.seller_id,
      NEW.product_id,
      OLD.stock,
      NEW.stock,
      CASE 
        WHEN NEW.stock < OLD.stock THEN 'sale'
        WHEN NEW.stock > OLD.stock THEN 'restock'
        ELSE 'manual'
      END,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS stock_change_logger ON seller_products;
CREATE TRIGGER stock_change_logger
  AFTER UPDATE ON seller_products
  FOR EACH ROW
  EXECUTE FUNCTION log_stock_change();

-- ============================================
-- 7. POLÍTICAS RLS ADICIONALES
-- ============================================

-- Permitir a vendedores ver su log de cambios de stock
CREATE POLICY "Sellers can view their stock changes"
  ON stock_changes_log FOR SELECT
  USING (seller_id = auth.uid());

-- ============================================
-- 8. VERIFICACIÓN Y TESTING
-- ============================================

-- Script de verificación
DO $$
BEGIN
  -- Verificar que la función existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'place_order_safe'
  ) THEN
    RAISE EXCEPTION 'Función place_order_safe no fue creada correctamente';
  END IF;

  -- Verificar índices
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_carts_user_seller'
  ) THEN
    RAISE WARNING 'Índice idx_carts_user_seller no existe';
  END IF;

  RAISE NOTICE '✅ Verificación completada con éxito';
END $$;

-- ============================================
-- INSTRUCCIONES DE MIGRACIÓN
-- ============================================

/*
PASOS PARA APLICAR ESTE FIX:

1. BACKUP DE LA BASE DE DATOS
   - Ir a Supabase Dashboard → Database → Backups
   - Crear backup manual

2. EJECUTAR ESTE SCRIPT
   - Copiar todo el contenido de este archivo
   - Ir a Supabase → SQL Editor
   - Pegar y ejecutar

3. ACTUALIZAR EL CÓDIGO DE LA APLICACIÓN
   - Cambiar en src/pages/api/checkout.ts:
     De: await supabase.rpc('place_order', {...})
     A:  await supabase.rpc('place_order_safe', {...})

4. TESTING
   - Probar compra simple
   - Probar compras simultáneas (2-3 usuarios)
   - Verificar que no hay sobreventa

5. MONITOREO
   - Revisar logs en Vercel
   - Revisar errores en Supabase
   - Monitorear tabla stock_changes_log

6. ROLLBACK (si algo falla)
   - Restaurar backup del paso 1
   - Revertir cambios en código
*/

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

