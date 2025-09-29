-- Actualizar función place_order para usar sistema de recompensas mejorado
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION place_order_with_expiration(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method VARCHAR(20),
  p_expiration_minutes INTEGER DEFAULT 15
) RETURNS JSON AS $$
DECLARE
  v_cart_id UUID;
  v_total_cents INTEGER := 0;
  v_order_id UUID;
  v_payment_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_points_earned INTEGER := 0;
  v_rewards_config RECORD;
  v_reward_tier RECORD;
  v_tier_multiplier DECIMAL := 1.0;
BEGIN
  -- Calcular tiempo de expiración
  v_expires_at := NOW() + (p_expiration_minutes || ' minutes')::INTERVAL;
  
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
  
  -- 3. Crear pedido con expiración
  INSERT INTO orders (
    user_id, 
    seller_id, 
    total_cents, 
    payment_method, 
    status, 
    expires_at,
    payment_status,
    delivery_address, 
    delivery_notes
  )
  VALUES (
    p_user_id, 
    p_seller_id, 
    v_total_cents, 
    p_payment_method, 
    'placed', 
    v_expires_at,
    CASE WHEN p_payment_method = 'transfer' THEN 'pending' ELSE 'confirmed' END,
    '{}', 
    ''
  )
  RETURNING id INTO v_order_id;
  
  -- 4. Crear registro de pago
  INSERT INTO payments (
    order_id,
    amount_cents,
    payment_method,
    status
  )
  VALUES (
    v_order_id,
    v_total_cents,
    p_payment_method,
    CASE WHEN p_payment_method = 'transfer' THEN 'pending' ELSE 'confirmed' END
  )
  RETURNING id INTO v_payment_id;
  
  -- 5. Crear items del pedido
  INSERT INTO order_items (order_id, product_id, title, price_cents, qty)
  SELECT v_order_id, ci.product_id, ci.title, ci.price_cents, ci.qty
  FROM cart_items ci
  WHERE ci.cart_id = v_cart_id;
  
  -- 6. PROCESAR SISTEMA DE RECOMPENSAS MEJORADO
  -- 6.1. Verificar si el vendedor tiene sistema de recompensas activo
  SELECT * INTO v_rewards_config FROM seller_rewards_config src
  WHERE src.seller_id = p_seller_id 
    AND src.is_active = true;

  IF v_rewards_config IS NOT NULL THEN
    -- 6.2. Verificar compra mínima
    IF v_total_cents >= v_rewards_config.minimum_purchase_cents THEN
      
      -- 6.3. Obtener nivel de recompensa según el total de compra
      SELECT * INTO v_reward_tier
      FROM seller_reward_tiers
      WHERE seller_id = p_seller_id 
        AND minimum_purchase_cents <= v_total_cents
        AND is_active = true
      ORDER BY minimum_purchase_cents DESC
      LIMIT 1;
      
      -- 6.4. Calcular multiplicador de nivel
      IF v_reward_tier IS NOT NULL THEN
        v_tier_multiplier := v_reward_tier.points_multiplier;
      ELSE
        v_tier_multiplier := 1.0; -- Nivel base
      END IF;
      
      -- 6.5. Calcular puntos con multiplicador de nivel
      v_points_earned := FLOOR(v_total_cents * v_rewards_config.points_per_peso * v_tier_multiplier);
      
      -- 6.6. Registrar en points_history
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
        'Puntos ganados por compra de $' || (v_total_cents / 100) || 
        CASE 
          WHEN v_reward_tier IS NOT NULL THEN ' en nivel ' || v_reward_tier.tier_name || ' (x' || v_tier_multiplier || ')'
          ELSE ' en nivel base'
        END
      );
      
      -- 6.7. Actualizar puntos totales del usuario
      INSERT INTO user_points (user_id, seller_id, points)
      VALUES (p_user_id, p_seller_id, v_points_earned)
      ON CONFLICT (user_id, seller_id) DO UPDATE
      SET 
        points = user_points.points + v_points_earned,
        updated_at = NOW();
    END IF;
  END IF;
  
  -- 7. Limpiar carrito
  DELETE FROM cart_items WHERE cart_id = v_cart_id;
  DELETE FROM carts WHERE id = v_cart_id;
  
  -- 8. Crear notificación para el comprador
  INSERT INTO notifications (user_id, type, title, message, order_id)
  VALUES (
    p_user_id,
    'order_placed',
    'Pedido realizado',
    'Tu pedido #' || v_order_id || ' ha sido realizado. ' || 
    CASE WHEN p_payment_method = 'transfer' 
      THEN 'Sube tu comprobante de transferencia para confirmar el pago.'
      ELSE 'El pago ha sido confirmado.'
    END ||
    CASE WHEN v_points_earned > 0 
      THEN ' Has ganado ' || v_points_earned || ' puntos por esta compra.'
      ELSE ''
    END,
    v_order_id
  );
  
  -- 9. Crear notificación para el vendedor
  INSERT INTO notifications (user_id, type, title, message, order_id)
  VALUES (
    p_seller_id,
    'new_order',
    'Nuevo pedido recibido',
    'Has recibido un nuevo pedido #' || v_order_id || ' por $' || (v_total_cents / 100.0)::TEXT,
    v_order_id
  );
  
  -- 10. Crear notificación de puntos si se ganaron
  IF v_points_earned > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, order_id)
    VALUES (
      p_user_id,
      'points_earned',
      '¡Puntos ganados!',
      'Has ganado ' || v_points_earned || ' puntos por tu compra de $' || (v_total_cents / 100.0)::TEXT ||
      CASE WHEN v_reward_tier IS NOT NULL THEN ' en nivel ' || v_reward_tier.tier_name ELSE '' END,
      v_order_id
    );
  END IF;
  
  -- 11. Retornar resultado
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'payment_id', v_payment_id,
    'total_cents', v_total_cents,
    'expires_at', v_expires_at,
    'payment_status', CASE WHEN p_payment_method = 'transfer' THEN 'pending' ELSE 'confirmed' END,
    'points_earned', v_points_earned,
    'tier_used', COALESCE(v_reward_tier.tier_name, 'Base'),
    'tier_multiplier', v_tier_multiplier
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- Función para calcular puntos disponibles para canje
CREATE OR REPLACE FUNCTION calculate_redeemable_points(
  p_user_id UUID,
  p_seller_id UUID,
  p_order_total_cents INTEGER
) RETURNS JSON AS $$
DECLARE
  v_user_points INTEGER := 0;
  v_rewards_config RECORD;
  v_pesos_per_point INTEGER;
  v_max_discount_cents INTEGER;
  v_max_points_usable INTEGER;
  v_available_points INTEGER;
BEGIN
  -- Obtener puntos del usuario para este vendedor
  SELECT COALESCE(points, 0) INTO v_user_points
  FROM user_points
  WHERE user_id = p_user_id AND seller_id = p_seller_id;
  
  IF v_user_points <= 0 THEN
    RETURN json_build_object(
      'success', true,
      'can_redeem', false,
      'reason', 'No tienes puntos disponibles para este vendedor',
      'available_points', 0
    );
  END IF;
  
  -- Obtener configuración de recompensas del vendedor
  SELECT * INTO v_rewards_config FROM seller_rewards_config
  WHERE seller_id = p_seller_id AND is_active = true;
  
  IF v_rewards_config IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'can_redeem', false,
      'reason', 'El vendedor no tiene sistema de recompensas activo',
      'available_points', v_user_points
    );
  END IF;
  
  -- Calcular valor de puntos
  v_pesos_per_point := ROUND(1 / v_rewards_config.points_per_peso);
  
  -- Máximo 50% de descuento del pedido
  v_max_discount_cents := FLOOR(p_order_total_cents * 0.5);
  v_max_points_usable := FLOOR(v_max_discount_cents / (v_pesos_per_point * 100));
  v_available_points := LEAST(v_user_points, v_max_points_usable);
  
  RETURN json_build_object(
    'success', true,
    'can_redeem', v_available_points > 0,
    'available_points', v_user_points,
    'pesos_per_point', v_pesos_per_point,
    'max_points_usable', v_available_points,
    'max_discount_cents', v_available_points * v_pesos_per_point * 100,
    'order_total_cents', p_order_total_cents
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- Vista para resumen de puntos por usuario y vendedor
CREATE OR REPLACE VIEW user_points_summary AS
SELECT 
  up.user_id,
  up.seller_id,
  s.email as seller_email,
  up.points as total_points,
  COALESCE(earned_stats.points_earned, 0) as points_earned,
  COALESCE(spent_stats.points_spent, 0) as points_spent,
  COALESCE(last_transaction.last_transaction_date, up.updated_at) as last_transaction_date
FROM user_points up
JOIN auth.users s ON s.id = up.seller_id
LEFT JOIN (
  SELECT 
    user_id, 
    seller_id, 
    SUM(points_earned) as points_earned
  FROM points_history 
  WHERE points_earned > 0
  GROUP BY user_id, seller_id
) earned_stats ON earned_stats.user_id = up.user_id AND earned_stats.seller_id = up.seller_id
LEFT JOIN (
  SELECT 
    user_id, 
    seller_id, 
    SUM(points_spent) as points_spent
  FROM points_history 
  WHERE points_spent > 0
  GROUP BY user_id, seller_id
) spent_stats ON spent_stats.user_id = up.user_id AND spent_stats.seller_id = up.seller_id
LEFT JOIN (
  SELECT 
    user_id, 
    seller_id, 
    MAX(created_at) as last_transaction_date
  FROM points_history 
  GROUP BY user_id, seller_id
) last_transaction ON last_transaction.user_id = up.user_id AND last_transaction.seller_id = up.seller_id;

-- Comentarios para documentación
COMMENT ON FUNCTION place_order_with_expiration(UUID, UUID, VARCHAR, INTEGER) IS 'Función mejorada para crear pedidos con expiración y sistema de recompensas con niveles';
COMMENT ON FUNCTION calculate_redeemable_points(UUID, UUID, INTEGER) IS 'Función para calcular puntos disponibles para canje según configuración del vendedor';
COMMENT ON VIEW user_points_summary IS 'Vista resumen de puntos por usuario y vendedor con estadísticas';

