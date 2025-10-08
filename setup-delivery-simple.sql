-- Setup simple para sistema de delivery
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla delivery_offers si no existe
CREATE TABLE IF NOT EXISTS delivery_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  pickup_address TEXT,
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, courier_id)
);

-- 2. Crear tabla couriers si no existe
CREATE TABLE IF NOT EXISTS couriers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'busy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS en las tablas
ALTER TABLE delivery_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para delivery_offers
DROP POLICY IF EXISTS "Couriers can view their own offers" ON delivery_offers;
CREATE POLICY "Couriers can view their own offers" ON delivery_offers
  FOR SELECT USING (courier_id = auth.uid());

DROP POLICY IF EXISTS "Couriers can update their own offers" ON delivery_offers;
CREATE POLICY "Couriers can update their own offers" ON delivery_offers
  FOR UPDATE USING (courier_id = auth.uid());

-- 5. Políticas RLS para couriers
DROP POLICY IF EXISTS "Users can view their own courier profile" ON couriers;
CREATE POLICY "Users can view their own courier profile" ON couriers
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own courier profile" ON couriers;
CREATE POLICY "Users can update their own courier profile" ON couriers
  FOR UPDATE USING (user_id = auth.uid());

-- 6. Verificar datos
SELECT 'delivery_offers' as tabla, COUNT(*) as count FROM delivery_offers
UNION ALL
SELECT 'couriers' as tabla, COUNT(*) as count FROM couriers
UNION ALL
SELECT 'orders' as tabla, COUNT(*) as count FROM orders;

-- 7. Mostrar couriers existentes
SELECT 'Couriers existentes:' as info, id, name, phone, status FROM couriers;
