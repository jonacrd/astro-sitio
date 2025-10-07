-- Configurar usuarios con número de WhatsApp +56962614851
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar comprador (comprador1@gmail.com)
UPDATE profiles 
SET phone = '+56962614851' 
WHERE email = 'comprador1@gmail.com';

-- 2. Actualizar vendedor (diego ramireza)
UPDATE profiles 
SET phone = '+56962614851' 
WHERE email = 'diego.ramireza@example.com' OR name ILIKE '%diego%ramireza%';

-- 3. Actualizar delivery (test@test.com)
UPDATE profiles 
SET phone = '+56962614851' 
WHERE email = 'test@test.com';

-- 4. Crear/actualizar courier si no existe
INSERT INTO couriers (id, name, email, phone, status, created_at)
VALUES (
  'test-courier-001',
  'Test Courier',
  'test@test.com', 
  '+56962614851',
  'active',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  phone = '+56962614851',
  status = 'active';

-- 5. Verificar usuarios configurados
SELECT 
  name,
  email, 
  phone,
  role
FROM profiles 
WHERE phone = '+56962614851'
UNION ALL
SELECT 
  name,
  email,
  phone,
  'courier' as role
FROM couriers 
WHERE phone = '+56962614851';
