-- Actualizar esquema de pedidos para manejar estados y notificaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

-- 2. Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'order_confirmed', 'order_delivered', 'points_earned'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de puntos de usuario
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  source VARCHAR(50) NOT NULL, -- 'purchase', 'referral', 'bonus'
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);

-- 5. Crear función para actualizar puntos
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_source VARCHAR(50),
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_points (user_id, points, source, order_id, description)
  VALUES (p_user_id, p_points, p_source, p_order_id, p_description);
  
  -- Actualizar puntos totales en el perfil
  UPDATE profiles 
  SET total_points = COALESCE(total_points, 0) + p_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear función para crear notificaciones
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_order_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, order_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_order_id);
END;
$$ LANGUAGE plpgsql;

-- 7. Crear función para confirmar pedido por vendedor
CREATE OR REPLACE FUNCTION confirm_order_by_seller(
  p_order_id UUID,
  p_seller_id UUID
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_buyer_id UUID;
BEGIN
  -- Verificar que el pedido existe y pertenece al vendedor
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND seller_id = p_seller_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pedido no encontrado');
  END IF;
  
  IF v_order.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'El pedido ya fue confirmado');
  END IF;
  
  -- Actualizar estado del pedido
  UPDATE orders 
  SET status = 'confirmed',
      seller_confirmed_at = NOW()
  WHERE id = p_order_id;
  
  -- Obtener buyer_id para notificación
  SELECT buyer_id INTO v_buyer_id FROM orders WHERE id = p_order_id;
  
  -- Crear notificación para el comprador
  PERFORM create_notification(
    v_buyer_id,
    'order_confirmed',
    '¡Pedido confirmado!',
    'Tu pedido ha sido confirmado por el vendedor. Pronto será entregado.',
    p_order_id
  );
  
  RETURN json_build_object('success', true, 'message', 'Pedido confirmado exitosamente');
END;
$$ LANGUAGE plpgsql;

-- 8. Crear función para confirmar entrega por vendedor
CREATE OR REPLACE FUNCTION confirm_delivery_by_seller(
  p_order_id UUID,
  p_seller_id UUID
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_buyer_id UUID;
  v_points INTEGER;
BEGIN
  -- Verificar que el pedido existe y pertenece al vendedor
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND seller_id = p_seller_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pedido no encontrado');
  END IF;
  
  IF v_order.status != 'confirmed' THEN
    RETURN json_build_object('success', false, 'error', 'El pedido debe estar confirmado primero');
  END IF;
  
  -- Actualizar estado del pedido
  UPDATE orders 
  SET status = 'delivered',
      delivery_confirmed_at = NOW()
  WHERE id = p_order_id;
  
  -- Obtener buyer_id para notificación
  SELECT buyer_id INTO v_buyer_id FROM orders WHERE id = p_order_id;
  
  -- Calcular puntos (1 punto por cada $1000 centavos)
  v_points := GREATEST(1, FLOOR(v_order.total_cents / 1000));
  
  -- Actualizar puntos en el pedido
  UPDATE orders SET points_awarded = v_points WHERE id = p_order_id;
  
  -- Agregar puntos al usuario
  PERFORM update_user_points(
    v_buyer_id,
    v_points,
    'purchase',
    p_order_id,
    'Puntos por compra completada'
  );
  
  -- Crear notificación para el comprador
  PERFORM create_notification(
    v_buyer_id,
    'order_delivered',
    '¡Pedido entregado!',
    'Tu pedido ha sido entregado. Has ganado ' || v_points || ' puntos.',
    p_order_id
  );
  
  -- Crear notificación de puntos
  PERFORM create_notification(
    v_buyer_id,
    'points_earned',
    '¡Puntos ganados!',
    'Has ganado ' || v_points || ' puntos por tu compra.',
    p_order_id
  );
  
  RETURN json_build_object('success', true, 'message', 'Entrega confirmada exitosamente', 'points', v_points);
END;
$$ LANGUAGE plpgsql;

-- 9. Crear función para confirmar recepción por comprador
CREATE OR REPLACE FUNCTION confirm_receipt_by_buyer(
  p_order_id UUID,
  p_buyer_id UUID
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Verificar que el pedido existe y pertenece al comprador
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND buyer_id = p_buyer_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pedido no encontrado');
  END IF;
  
  IF v_order.status != 'delivered' THEN
    RETURN json_build_object('success', false, 'error', 'El pedido debe estar entregado primero');
  END IF;
  
  -- Actualizar estado del pedido
  UPDATE orders 
  SET status = 'completed',
      buyer_confirmed_at = NOW()
  WHERE id = p_order_id;
  
  RETURN json_build_object('success', true, 'message', 'Recepción confirmada exitosamente');
END;
$$ LANGUAGE plpgsql;

-- 10. Agregar columna total_points a profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- 11. Crear RLS policies para las nuevas tablas
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Política para notifications: usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política para user_points: usuarios solo pueden ver sus propios puntos
CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

-- 12. Crear vista para dashboard de vendedores
CREATE OR REPLACE VIEW seller_orders_dashboard AS
SELECT 
  o.id,
  o.buyer_id,
  o.total_cents,
  o.status,
  o.created_at,
  o.seller_confirmed_at,
  o.buyer_confirmed_at,
  o.delivery_confirmed_at,
  o.delivery_address,
  o.delivery_notes,
  o.points_awarded,
  p.name as buyer_name,
  p.phone as buyer_phone,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN profiles p ON o.buyer_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.seller_id = auth.uid()
GROUP BY o.id, o.buyer_id, o.total_cents, o.status, o.created_at, 
         o.seller_confirmed_at, o.buyer_confirmed_at, o.delivery_confirmed_at,
         o.delivery_address, o.delivery_notes, o.points_awarded, p.name, p.phone
ORDER BY o.created_at DESC;

-- 13. Crear vista para notificaciones de compradores
CREATE OR REPLACE VIEW buyer_notifications AS
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.order_id,
  n.read_at,
  n.created_at,
  o.status as order_status,
  o.total_cents
FROM notifications n
LEFT JOIN orders o ON n.order_id = o.id
WHERE n.user_id = auth.uid()
ORDER BY n.created_at DESC;

-- 14. Crear vista para puntos del usuario
CREATE OR REPLACE VIEW user_points_summary AS
SELECT 
  up.id,
  up.points,
  up.source,
  up.description,
  up.created_at,
  o.status as order_status
FROM user_points up
LEFT JOIN orders o ON up.order_id = o.id
WHERE up.user_id = auth.uid()
ORDER BY up.created_at DESC;