-- Script para corregir la función place_order (eliminar referencia a sp.id)

DROP FUNCTION IF EXISTS place_order(UUID, UUID, TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method TEXT,
  p_delivery_address JSONB DEFAULT '{}',
  p_delivery_notes TEXT DEFAULT ''
)
RETURNS TABLE (
  order_id UUID,
  total_cents BIGINT,
  delivery_cents BIGINT,
  final_total_cents BIGINT
) AS $$
DECLARE
  v_order_id UUID;
  v_total_cents BIGINT := 0;
  v_delivery_cents BIGINT := 0;
  v_final_total_cents BIGINT;
  v_item RECORD;
  v_points_earned INTEGER := 0;
BEGIN
  -- Validar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Validar que el vendedor existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_seller_id AND is_seller = TRUE) THEN
    RAISE EXCEPTION 'Vendedor no encontrado';
  END IF;

  -- Crear el pedido
  INSERT INTO orders (
    user_id,
    seller_id,
    total_cents,
    status,
    payment_method,
    delivery_cents,
    delivery_address,
    delivery_notes
  ) VALUES (
    p_user_id,
    p_seller_id,
    0, -- Se actualizará después
    'pending',
    p_payment_method,
    v_delivery_cents,
    p_delivery_address,
    p_delivery_notes
  ) RETURNING id INTO v_order_id;

  -- Procesar items del carrito desde seller_products
  -- Nota: Esta función es simplificada. En producción, los items deberían
  -- venir como parámetro desde el frontend.
  FOR v_item IN
    SELECT 
      sp.seller_id,
      sp.product_id,
      sp.price_cents,
      sp.stock,
      1 as quantity -- La cantidad debería venir del frontend
    FROM seller_products sp
    WHERE sp.seller_id = p_seller_id
      AND sp.active = TRUE
      AND sp.stock > 0
    LIMIT 1 -- Solo procesar 1 item por ahora como ejemplo
  LOOP
    -- Verificar stock disponible
    IF v_item.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', v_item.product_id;
    END IF;

    -- Insertar item del pedido
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price_cents
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.quantity,
      v_item.price_cents
    );

    -- Actualizar stock (DESCONTAR) usando seller_id y product_id como clave
    UPDATE seller_products
    SET 
      stock = stock - v_item.quantity,
      updated_at = NOW()
    WHERE seller_id = v_item.seller_id
      AND product_id = v_item.product_id;

    -- Acumular total
    v_total_cents := v_total_cents + (v_item.price_cents * v_item.quantity);
    
    -- Calcular puntos (1 punto por cada $100 CLP)
    v_points_earned := v_points_earned + FLOOR((v_item.price_cents * v_item.quantity) / 10000);
  END LOOP;

  -- Si no hay items, lanzar error
  IF v_total_cents = 0 THEN
    RAISE EXCEPTION 'No hay items en el pedido';
  END IF;

  -- Calcular total final
  v_final_total_cents := v_total_cents + v_delivery_cents;

  -- Actualizar el total del pedido
  UPDATE orders
  SET total_cents = v_final_total_cents
  WHERE id = v_order_id;

  -- Agregar puntos al usuario
  IF v_points_earned > 0 THEN
    INSERT INTO user_points (user_id, points, source, order_id)
    VALUES (p_user_id, v_points_earned, 'purchase', v_order_id);
  END IF;

  -- Retornar información del pedido
  RETURN QUERY
  SELECT 
    v_order_id,
    v_total_cents,
    v_delivery_cents,
    v_final_total_cents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION place_order(UUID, UUID, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION place_order(UUID, UUID, TEXT, JSONB, TEXT) TO anon;

-- Verificar
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'place_order';



