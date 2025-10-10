-- Script simplificado para configurar WhatsApp
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de profiles
SELECT * FROM profiles LIMIT 1;

-- 2. Buscar usuarios existentes
SELECT id, name, phone, role FROM profiles LIMIT 10;

-- 3. Actualizar todos los usuarios con el número de WhatsApp
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

-- 5. Verificar resultado
SELECT 'profiles' as tabla, id, name, phone FROM profiles WHERE phone = '+56962614851'
UNION ALL
SELECT 'couriers' as tabla, id, name, phone FROM couriers WHERE phone = '+56962614851';



