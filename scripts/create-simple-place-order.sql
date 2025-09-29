-- Función place_order simplificada y funcional
CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method VARCHAR(20)
) RETURNS JSON AS $$
DECLARE
  v_cart_id UUID;
  v_total_cents INTEGER := 0;
  v_order_id UUID;
  v_points_earned INTEGER := 0;
  v_rewards_config RECORD;
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
  
  -- 2. Calcular total
  SELECT COALESCE(SUM(ci.price_cents * ci.qty), 0) INTO v_total_cents
  FROM cart_items ci
  WHERE ci.cart_id = v_cart_id;
  
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
  
  -- 4. Crear items del pedido
  INSERT INTO order_items (order_id, product_id, title, price_cents, qty)
  SELECT v_order_id, ci.product_id, ci.title, ci.price_cents, ci.qty
  FROM cart_items ci
  WHERE ci.cart_id = v_cart_id;
  
  -- 5. Limpiar carrito
  DELETE FROM cart_items WHERE cart_id = v_cart_id;
  DELETE FROM carts WHERE id = v_cart_id;
  
  -- 6. PROCESAR SISTEMA DE RECOMPENSAS
  -- 6.1. Verificar si el vendedor tiene sistema de recompensas activo
  SELECT * INTO v_rewards_config FROM seller_rewards_config src
  WHERE src.seller_id = p_seller_id 
    AND src.is_active = true;

  IF v_rewards_config IS NOT NULL THEN
    -- 6.2. Verificar compra mínima
    IF v_total_cents >= v_rewards_config.minimum_purchase_cents THEN
      -- 6.3. Calcular puntos (1 punto por cada $1,000 pesos)
      v_points_earned := FLOOR(v_total_cents / 1000);

      -- 6.4. Registrar en points_history
      INSERT INTO points_history (
        user_id,
        seller_id,
        order_id,
        points_earned,
        transaction_type,
        description
      ) VALUES (
        p_user_id,
        p_seller_id,
        v_order_id,
        v_points_earned,
        'earned',
        'Puntos ganados por compra de $' || (v_total_cents / 100) || ' (1 punto por $1,000)'
      );

      -- 6.5. Actualizar puntos totales del usuario
      INSERT INTO user_points (user_id, seller_id, points)
      VALUES (p_user_id, p_seller_id, v_points_earned)
      ON CONFLICT (user_id, seller_id) DO UPDATE
      SET points = user_points.points + EXCLUDED.points;
    END IF;
  END IF;

  -- 7. Retornar resultado
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
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;





