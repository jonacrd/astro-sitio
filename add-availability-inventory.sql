-- =====================================================
-- SISTEMA DE INVENTARIO DUAL
-- Agrega soporte para productos de disponibilidad diaria
-- =====================================================

-- 1. Agregar columnas nuevas a seller_products
ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS inventory_mode VARCHAR(20) DEFAULT 'count' CHECK (inventory_mode IN ('count', 'availability'));

ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS available_today BOOLEAN DEFAULT false;

ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS portion_limit INTEGER;

ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS portion_used INTEGER DEFAULT 0;

ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS sold_out BOOLEAN DEFAULT false;

ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS last_available_on DATE;

ALTER TABLE seller_products 
ADD COLUMN IF NOT EXISTS prep_minutes INTEGER;

-- 2. Actualizar productos existentes para usar 'count' por defecto
UPDATE seller_products 
SET inventory_mode = 'count' 
WHERE inventory_mode IS NULL;

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_seller_products_inventory_mode 
ON seller_products(inventory_mode);

CREATE INDEX IF NOT EXISTS idx_seller_products_available_today 
ON seller_products(available_today) 
WHERE inventory_mode = 'availability';

-- 4. Función para resetear porciones al cambiar el día
CREATE OR REPLACE FUNCTION reset_daily_portions()
RETURNS void AS $$
BEGIN
  UPDATE seller_products
  SET 
    portion_used = 0,
    sold_out = false,
    last_available_on = CURRENT_DATE
  WHERE 
    inventory_mode = 'availability'
    AND available_today = true
    AND (last_available_on IS NULL OR last_available_on < CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para auto-resetear porciones cuando se marca available_today
CREATE OR REPLACE FUNCTION auto_reset_portions_on_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está activando available_today y es un nuevo día
  IF NEW.available_today = true 
     AND NEW.inventory_mode = 'availability'
     AND (OLD.last_available_on IS NULL OR OLD.last_available_on < CURRENT_DATE) THEN
    NEW.portion_used = 0;
    NEW.sold_out = false;
    NEW.last_available_on = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reset_portions ON seller_products;
CREATE TRIGGER trigger_reset_portions
  BEFORE UPDATE ON seller_products
  FOR EACH ROW
  EXECUTE FUNCTION auto_reset_portions_on_availability();

-- 6. Actualizar función place_order para manejar ambos modos
CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method TEXT,
  p_delivery_address JSONB DEFAULT NULL,
  p_delivery_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  total_amount INTEGER
) AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_total_cents INTEGER := 0;
  v_item RECORD;
BEGIN
  -- Validar que hay items en el carrito
  IF NOT EXISTS (
    SELECT 1 FROM cart_items 
    WHERE user_id = p_user_id AND seller_id = p_seller_id
  ) THEN
    RAISE EXCEPTION 'No hay items en el carrito para procesar';
  END IF;

  -- Generar número de orden
  v_order_number := 'ORD-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5);

  -- Crear orden
  INSERT INTO orders (
    user_id, 
    seller_id, 
    total_cents, 
    status, 
    payment_method,
    order_number,
    delivery_address,
    delivery_notes,
    delivery_cents
  )
  VALUES (
    p_user_id, 
    p_seller_id, 
    0, -- Se calculará después
    'pending', 
    p_payment_method,
    v_order_number,
    COALESCE(p_delivery_address, '{}'::jsonb),
    p_delivery_notes,
    0
  )
  RETURNING id INTO v_order_id;

  -- Procesar items del carrito
  FOR v_item IN 
    SELECT 
      ci.product_id,
      ci.quantity,
      sp.price_cents,
      sp.stock,
      sp.inventory_mode,
      sp.available_today,
      sp.sold_out,
      sp.portion_limit,
      sp.portion_used
    FROM cart_items ci
    JOIN seller_products sp ON ci.product_id = sp.product_id AND ci.seller_id = sp.seller_id
    WHERE ci.user_id = p_user_id AND ci.seller_id = p_seller_id
  LOOP
    -- Validar disponibilidad según modo de inventario
    IF v_item.inventory_mode = 'count' THEN
      -- Modo tradicional: validar stock
      IF v_item.stock < v_item.quantity THEN
        RAISE EXCEPTION 'Stock insuficiente para producto %', v_item.product_id;
      END IF;
      
      -- Descontar stock
      UPDATE seller_products
      SET 
        stock = stock - v_item.quantity,
        updated_at = NOW()
      WHERE seller_id = p_seller_id 
        AND product_id = v_item.product_id;
        
    ELSIF v_item.inventory_mode = 'availability' THEN
      -- Modo disponibilidad: validar estado del día
      IF NOT v_item.available_today OR v_item.sold_out THEN
        RAISE EXCEPTION 'Producto % no disponible hoy', v_item.product_id;
      END IF;
      
      -- Validar cupo si existe
      IF v_item.portion_limit IS NOT NULL THEN
        IF v_item.portion_used + v_item.quantity > v_item.portion_limit THEN
          RAISE EXCEPTION 'Cupo diario alcanzado para producto %', v_item.product_id;
        END IF;
      END IF;
      
      -- Incrementar porciones usadas
      UPDATE seller_products
      SET 
        portion_used = portion_used + v_item.quantity,
        sold_out = CASE 
          WHEN portion_limit IS NOT NULL AND portion_used + v_item.quantity >= portion_limit 
          THEN true 
          ELSE sold_out 
        END,
        last_available_on = CURRENT_DATE,
        updated_at = NOW()
      WHERE seller_id = p_seller_id 
        AND product_id = v_item.product_id;
    END IF;

    -- Crear order_item
    INSERT INTO order_items (order_id, product_id, quantity, price_cents)
    VALUES (v_order_id, v_item.product_id, v_item.quantity, v_item.price_cents);

    -- Acumular total
    v_total_cents := v_total_cents + (v_item.price_cents * v_item.quantity);
  END LOOP;

  -- Actualizar total de la orden
  UPDATE orders SET total_cents = v_total_cents WHERE id = v_order_id;

  -- Limpiar carrito
  DELETE FROM cart_items WHERE user_id = p_user_id AND seller_id = p_seller_id;

  -- Calcular y otorgar puntos (10% del total)
  INSERT INTO user_points (user_id, points, reason, reference_id)
  VALUES (
    p_user_id,
    FLOOR(v_total_cents * 0.10),
    'order_purchase',
    v_order_id
  );

  RETURN QUERY SELECT v_order_id, v_order_number, v_total_cents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Políticas RLS para las nuevas columnas (ya están cubiertas por políticas existentes)
-- No se requieren cambios adicionales en RLS

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================

-- Verificar que todo se aplicó correctamente
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'seller_products'
  AND column_name IN (
    'inventory_mode', 
    'available_today', 
    'portion_limit', 
    'portion_used', 
    'sold_out', 
    'last_available_on',
    'prep_minutes'
  )
ORDER BY ordinal_position;



