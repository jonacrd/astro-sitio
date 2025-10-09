-- Script final para configurar usuarios con WhatsApp
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Ver todos los usuarios existentes
SELECT id, name, phone, role FROM profiles LIMIT 20;

-- 3. Actualizar todos los usuarios que no tengan teléfono
UPDATE profiles 
SET phone = '+56962614851' 
WHERE phone IS NULL OR phone = '';

-- 4. Crear courier si no existe
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

-- 5. Verificar resultado final
SELECT 'profiles' as tabla, id, name, phone, role FROM profiles WHERE phone = '+56962614851'
UNION ALL
SELECT 'couriers' as tabla, id, name, phone, 'courier' as role FROM couriers WHERE phone = '+56962614851';

