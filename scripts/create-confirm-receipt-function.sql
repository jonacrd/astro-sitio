-- Crear función RPC para confirmar recepción por comprador
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION confirm_receipt_by_buyer(
  p_order_id UUID,
  p_buyer_id UUID
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Verificar que el pedido existe y pertenece al comprador
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND user_id = p_buyer_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pedido no encontrado');
  END IF;
  
  IF v_order.status != 'delivered' THEN
    RETURN json_build_object('success', false, 'error', 'El pedido debe estar entregado primero');
  END IF;
  
  -- Actualizar estado del pedido
  UPDATE orders 
  SET status = 'completed',
      buyer_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Crear notificación para el vendedor
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    order_id
  ) VALUES (
    v_order.seller_id,
    'order_status',
    'Pedido Completado',
    'El comprador ha confirmado la recepción del pedido #' || SUBSTRING(p_order_id::text, 1, 8),
    p_order_id
  );
  
  RETURN json_build_object('success', true, 'message', 'Recepción confirmada exitosamente');
END;
$$ LANGUAGE plpgsql;












