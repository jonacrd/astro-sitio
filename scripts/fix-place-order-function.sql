-- Función place_order corregida
CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method VARCHAR(20)
) RETURNS JSON AS $$
DECLARE
  v_cart_id UUID;
  v_total_cents INTEGER := 0;
  v_order_id UUID;
  v_cart_item RECORD;
  v_rewards_config RECORD;
  v_reward_tier RECORD;
  v_points_earned INTEGER := 0;
  v_tier_multiplier DECIMAL(10,4) := 1.0;
  v_result JSON;
BEGIN
  -- 1. Obtener carrito del usuario
  SELECT id INTO v_cart_id
  FROM carts
  WHERE user_id = p_user_id AND seller_id = p_seller_id;
  
  IF v_cart_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No hay carrito para este vendedor'
    );
  END IF;
  
  -- 2. Calcular total
  SELECT COALESCE(SUM(price_cents * qty), 0) INTO v_total_cents
  FROM cart_items
  WHERE cart_id = v_cart_id;
  
  IF v_total_cents = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El carrito está vacío'
    );
  END IF;
  
  -- 3. Crear pedido
  INSERT INTO orders (user_id, seller_id, total_cents, payment_method, status)
  VALUES (p_user_id, p_seller_id, v_total_cents, p_payment_method, 'pending')
  RETURNING id INTO v_order_id;
  
  -- 4. Crear items del pedido
  FOR v_cart_item IN 
    SELECT * FROM cart_items WHERE cart_id = v_cart_id
  LOOP
    INSERT INTO order_items (order_id, product_id, title, price_cents, qty)
    VALUES (v_order_id, v_cart_item.product_id, v_cart_item.title, 
            v_cart_item.price_cents, v_cart_item.qty);
  END LOOP;
  
  -- 5. Verificar sistema de recompensas
  SELECT * INTO v_rewards_config
  FROM seller_rewards_config
  WHERE seller_id = p_seller_id AND is_active = true;
  
  -- 6. Si hay sistema de recompensas y cumple mínimo
  IF v_rewards_config IS NOT NULL AND v_total_cents >= v_rewards_config.minimum_purchase_cents THEN
    
    -- Obtener nivel de recompensa
    SELECT * INTO v_reward_tier
    FROM seller_reward_tiers
    WHERE seller_id = p_seller_id 
      AND minimum_purchase_cents <= v_total_cents
      AND is_active = true
    ORDER BY minimum_purchase_cents DESC
    LIMIT 1;
    
    -- Si no hay nivel específico, usar configuración base
    IF v_reward_tier IS NULL THEN
      v_tier_multiplier := 1.0;
    ELSE
      v_tier_multiplier := v_reward_tier.points_multiplier;
    END IF;
    
    -- Calcular puntos
    v_points_earned := FLOOR(v_total_cents * v_rewards_config.points_per_peso * v_tier_multiplier);
    
    -- Crear/actualizar puntos del usuario
    INSERT INTO user_points (user_id, seller_id, points, source, order_id)
    VALUES (p_user_id, p_seller_id, v_points_earned, 'order', v_order_id)
    ON CONFLICT (user_id, seller_id)
    DO UPDATE SET 
      points = user_points.points + v_points_earned,
      updated_at = NOW();
    
    -- Crear historial de puntos
    INSERT INTO points_history (user_id, seller_id, order_id, points_earned, transaction_type, description)
    VALUES (p_user_id, p_seller_id, v_order_id, v_points_earned, 'earned', 
            'Puntos ganados por compra de $' || (v_total_cents / 100) || ' en nivel ' || COALESCE(v_reward_tier.tier_name, 'Base'));
  END IF;
  
  -- 7. Limpiar carrito
  DELETE FROM cart_items WHERE cart_id = v_cart_id;
  DELETE FROM carts WHERE id = v_cart_id;
  
  -- 8. Retornar resultado
  v_result := json_build_object(
    'success', true,
    'orderId', v_order_id,
    'totalCents', v_total_cents,
    'pointsAdded', v_points_earned
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;










