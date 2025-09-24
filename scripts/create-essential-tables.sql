-- Script esencial para crear las tablas y vistas necesarias
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

-- 1.1. Agregar claves foráneas a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.2. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 2. Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
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
  source VARCHAR(50) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Agregar columna total_points a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- 5. Crear vista para dashboard de vendedores
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

-- 6. Crear vista para notificaciones de compradores
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

-- 7. Crear vista para puntos del usuario
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

-- 8. Configurar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas RLS
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

-- Crear vista para dashboard de pedidos del vendedor
CREATE OR REPLACE VIEW seller_orders_dashboard AS
SELECT 
  o.id as order_id,
  o.order_code,
  o.total_cents,
  o.status,
  o.created_at,
  o.updated_at,
  o.delivery_address,
  o.delivery_phone,
  o.delivery_notes,
  -- Información del comprador
  p_buyer.name as buyer_name,
  p_buyer.phone as buyer_phone,
  -- Información del vendedor
  o.seller_id,
  p_seller.name as seller_name,
  -- Resumen de items
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN profiles p_buyer ON o.buyer_id = p_buyer.id
LEFT JOIN profiles p_seller ON o.seller_id = p_seller.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY 
  o.id, o.order_code, o.total_cents, o.status, o.created_at, o.updated_at,
  o.delivery_address, o.delivery_phone, o.delivery_notes,
  p_buyer.name, p_buyer.phone, o.seller_id, p_seller.name;

-- Crear vista para notificaciones del comprador
CREATE OR REPLACE VIEW buyer_notifications AS
SELECT 
  o.id as order_id,
  o.order_code,
  o.status,
  o.created_at,
  o.updated_at,
  o.buyer_id,
  p_seller.name as seller_name,
  COUNT(oi.id) as item_count,
  o.total_cents
FROM orders o
LEFT JOIN profiles p_seller ON o.seller_id = p_seller.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY 
  o.id, o.order_code, o.status, o.created_at, o.updated_at,
  o.buyer_id, p_seller.name, o.total_cents;

-- Crear vista para resumen de puntos del usuario
CREATE OR REPLACE VIEW user_points_summary AS
SELECT 
  user_id,
  SUM(points) as total_points,
  COUNT(*) as transaction_count,
  MAX(created_at) as last_transaction
FROM user_points
GROUP BY user_id;
