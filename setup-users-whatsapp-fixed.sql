-- Script corregido para configurar usuarios con WhatsApp
-- Ejecutar en Supabase SQL Editor

-- 1. Primero verificar la estructura de la tabla profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Verificar si existe la tabla couriers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'couriers' 
ORDER BY ordinal_position;

-- 3. Buscar usuarios existentes por ID o nombre
SELECT id, name, phone, role 
FROM profiles 
WHERE name ILIKE '%comprador%' OR name ILIKE '%diego%' OR name ILIKE '%test%';

-- 4. Actualizar usuarios por ID (si los encontramos)
-- Reemplaza estos IDs con los reales de tu base de datos
UPDATE profiles 
SET phone = '+56962614851' 
WHERE id = 'comprador1@gmail.com' OR name ILIKE '%comprador%';

UPDATE profiles 
SET phone = '+56962614851' 
WHERE name ILIKE '%diego%' OR name ILIKE '%ramireza%';

UPDATE profiles 
SET phone = '+56962614851' 
WHERE name ILIKE '%test%' OR id = 'test@test.com';

-- 5. Crear/actualizar courier si no existe
INSERT INTO couriers (id, name, email, phone, status, created_at)
VALUES (
  'test-courier-001',
  'Test Courier',
  'test@test.com', 
  '+56962614851',
  'active',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  phone = '+56962614851',
  status = 'active';

-- 6. Verificar usuarios configurados
SELECT 
  id,
  name,
  phone,
  role
FROM profiles 
WHERE phone = '+56962614851'
UNION ALL
SELECT 
  id,
  name,
  phone,
  'courier' as role
FROM couriers 
WHERE phone = '+56962614851';
