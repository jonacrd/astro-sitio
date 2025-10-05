-- Script para actualizar la función place_order con descuento de stock automático
-- Ya ejecutado en Supabase

-- 1. PRIMERO: Eliminar la función antigua
DROP FUNCTION IF EXISTS place_order(UUID, UUID, TEXT);

-- 2. DESPUÉS: Crear la función nueva con descuento de stock
CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_id UUID;
  v_total_cents INTEGER := 0;
  v_order_id UUID;
  v_points_earned INTEGER := 0;
  cart_item_record RECORD;
BEGIN
  -- 1. Obtener carrito del usuario
  SELECT c.id INTO v_cart_id
  FROM carts c
  WHERE c.user_id = p_user_id AND c.seller_id = p_seller_id;
  
  IF v_cart_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No hay carrito para este vendedor'
    );
  END IF;
  
  -- 2. Calcular total Y verificar stock
  FOR cart_item_record IN 
    SELECT ci.*, sp.stock, sp.price_cents as seller_price_cents
    FROM cart_items ci
    LEFT JOIN seller_products sp ON sp.product_id = ci.product_id AND sp.seller_id = p_seller_id
    WHERE ci.cart_id = v_cart_id
  LOOP
    -- Verificar stock disponible
    IF cart_item_record.stock IS NULL OR cart_item_record.stock < cart_item_record.qty THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Stock insuficiente para: ' || cart_item_record.title
      );
    END IF;
    
    -- Calcular total
    v_total_cents := v_total_cents + (COALESCE(cart_item_record.seller_price_cents, cart_item_record.price_cents) * cart_item_record.qty);
  END LOOP;
  
  IF v_total_cents = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El carrito está vacío'
    );
  END IF;
  
  -- 3. Crear pedido
  INSERT INTO orders (user_id, seller_id, total_cents, payment_method, status, delivery_address, delivery_notes)
  VALUES (p_user_id, p_seller_id, v_total_cents, p_payment_method, 'pending', '{}', '')
  RETURNING id INTO v_order_id;
  
  -- 4. Crear items del pedido Y DESCONTAR STOCK
  FOR cart_item_record IN 
    SELECT ci.*, sp.stock, sp.price_cents as seller_price_cents
    FROM cart_items ci
    LEFT JOIN seller_products sp ON sp.product_id = ci.product_id AND sp.seller_id = p_seller_id
    WHERE ci.cart_id = v_cart_id
  LOOP
    -- Insertar item de la orden
    INSERT INTO order_items (order_id, product_id, title, price_cents, qty)
    VALUES (v_order_id, cart_item_record.product_id, cart_item_record.title, COALESCE(cart_item_record.seller_price_cents, cart_item_record.price_cents), cart_item_record.qty);
    
    -- 🔥 DESCONTAR STOCK DEL VENDEDOR
    UPDATE seller_products 
    SET stock = stock - cart_item_record.qty,
        updated_at = NOW()
    WHERE product_id = cart_item_record.product_id 
      AND seller_id = p_seller_id;
      
    RAISE NOTICE 'Stock descontado: % unidades del producto %', cart_item_record.qty, cart_item_record.title;
  END LOOP;
  
  -- 5. Limpiar carrito
  DELETE FROM cart_items WHERE cart_id = v_cart_id;
  DELETE FROM carts WHERE id = v_cart_id;
  
  -- 6. Calcular puntos
  v_points_earned := v_total_cents / 10000; -- 1 punto por cada $100
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'orderId', v_order_id,
    'totalCents', v_total_cents,
    'pointsAdded', v_points_earned
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Error procesando orden: ' || SQLERRM
    );
END;
$$;

-- 3. Otorgar permisos
GRANT EXECUTE ON FUNCTION place_order(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION place_order(UUID, UUID, TEXT) TO anon;



