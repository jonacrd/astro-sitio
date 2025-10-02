-- Actualizar función place_order para usar el sistema de recompensas
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION place_order(
  user_id UUID,
  seller_id UUID,
  payment_method TEXT
) RETURNS JSON AS $$
DECLARE
  cart_record RECORD;
  cart_item RECORD;
  total_cents INTEGER := 0;
  order_id UUID;
  points_added INTEGER := 0;
  rewards_config RECORD;
  reward_tier RECORD;
  tier_multiplier DECIMAL := 1.0;
BEGIN
  -- Obtener carrito
  SELECT * INTO cart_record FROM carts 
  WHERE carts.user_id = place_order.user_id 
    AND carts.seller_id = place_order.seller_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Carrito no encontrado');
  END IF;

  -- Calcular total
  SELECT COALESCE(SUM(ci.qty * ci.price_cents), 0) INTO total_cents
  FROM cart_items ci
  WHERE ci.cart_id = cart_record.id;

  -- Crear pedido
  INSERT INTO orders (user_id, seller_id, total_cents, payment_method, status, delivery_address, delivery_notes)
  VALUES (place_order.user_id, place_order.seller_id, total_cents, place_order.payment_method, 'pending', '{}', '')
  RETURNING id INTO order_id;

  -- Crear items del pedido
  INSERT INTO order_items (order_id, product_id, title, price_cents, qty)
  SELECT order_id, ci.product_id, ci.title, ci.price_cents, ci.qty
  FROM cart_items ci
  WHERE ci.cart_id = cart_record.id;

  -- Limpiar carrito
  DELETE FROM cart_items WHERE cart_id = cart_record.id;
  DELETE FROM carts WHERE id = cart_record.id;

  -- PROCESAR SISTEMA DE RECOMPENSAS
  -- 1. Verificar si el vendedor tiene sistema de recompensas activo
  SELECT * INTO rewards_config FROM seller_rewards_config 
  WHERE seller_rewards_config.seller_id = place_order.seller_id 
    AND seller_rewards_config.is_active = true;

  IF FOUND THEN
    -- 2. Verificar compra mínima
    IF total_cents >= rewards_config.minimum_purchase_cents THEN
      -- 3. Determinar nivel de recompensa
      SELECT * INTO reward_tier FROM seller_reward_tiers 
      WHERE seller_reward_tiers.seller_id = place_order.seller_id 
        AND seller_reward_tiers.is_active = true
        AND total_cents >= seller_reward_tiers.minimum_purchase_cents
      ORDER BY seller_reward_tiers.minimum_purchase_cents DESC
      LIMIT 1;

      IF FOUND THEN
        tier_multiplier := reward_tier.points_multiplier;
      END IF;

      -- 4. Calcular puntos (1 punto por cada $1,000 pesos)
      points_added := FLOOR((total_cents * tier_multiplier) / 100000); -- 100000 centavos = $1,000

      -- 5. Registrar en points_history
      INSERT INTO points_history (
        user_id,
        seller_id,
        order_id,
        points_earned,
        transaction_type,
        description
      ) VALUES (
        place_order.user_id,
        place_order.seller_id,
        order_id,
        points_added,
        'earned',
        'Puntos ganados por compra de $' || (total_cents / 100) || ' (Nivel: ' || COALESCE(reward_tier.tier_name, 'Bronce') || ')'
      );

      -- 6. Actualizar puntos totales del usuario
      INSERT INTO user_points (user_id, seller_id, points, source, order_id)
      VALUES (place_order.user_id, place_order.seller_id, points_added, 'order', order_id)
      ON CONFLICT (user_id, seller_id) DO UPDATE SET 
        points = user_points.points + points_added,
        updated_at = NOW();
    END IF;
  END IF;

  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'orderId', order_id,
    'totalCents', total_cents,
    'pointsAdded', points_added,
    'tierUsed', COALESCE(reward_tier.tier_name, 'N/A')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;







