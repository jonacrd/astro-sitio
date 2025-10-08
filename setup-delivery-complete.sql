-- Setup completo para sistema de delivery
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

-- 3. Insertar usuario courier de prueba
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@test.com',
  crypt('delivery123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 4. Obtener el ID del usuario courier
WITH courier_user AS (
  SELECT id FROM auth.users WHERE email = 'test@test.com'
)
INSERT INTO couriers (user_id, name, phone, status)
SELECT id, 'test', '+56962614851', 'active'
FROM courier_user
ON CONFLICT (user_id) DO UPDATE SET
  phone = EXCLUDED.phone,
  status = 'active';

-- 5. Habilitar RLS en las tablas
ALTER TABLE delivery_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para delivery_offers
CREATE POLICY "Couriers can view their own offers" ON delivery_offers
  FOR SELECT USING (courier_id = auth.uid());

CREATE POLICY "Couriers can update their own offers" ON delivery_offers
  FOR UPDATE USING (courier_id = auth.uid());

-- 7. Políticas RLS para couriers
CREATE POLICY "Users can view their own courier profile" ON couriers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own courier profile" ON couriers
  FOR UPDATE USING (user_id = auth.uid());

-- 8. Verificar datos
SELECT 'delivery_offers' as tabla, COUNT(*) as count FROM delivery_offers
UNION ALL
SELECT 'couriers' as tabla, COUNT(*) as count FROM couriers
UNION ALL
SELECT 'orders' as tabla, COUNT(*) as count FROM orders;

-- 9. Mostrar courier creado
SELECT 'Courier creado:' as info, id, name, phone, status FROM couriers WHERE phone = '+56962614851';
