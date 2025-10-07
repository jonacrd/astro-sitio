-- Script para configurar WhatsApp del vendedor
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los usuarios para identificar al vendedor
SELECT id, name, email, phone FROM profiles ORDER BY created_at DESC LIMIT 20;

-- 2. Actualizar vendedor por nombre (diego ramireza)
UPDATE profiles 
SET phone = '+56962614851'
WHERE name ILIKE '%diego%' OR name ILIKE '%ramireza%';

-- 3. Actualizar vendedor por email (si conoces el email)
UPDATE profiles 
SET phone = '+56962614851'
WHERE email ILIKE '%diego%';

-- 4. Actualizar TODOS los vendedores (más seguro)
UPDATE profiles 
SET phone = '+56962614851'
WHERE role = 'seller' OR role = 'vendedor';

-- 5. Si no funciona, actualizar TODOS los usuarios
UPDATE profiles 
SET phone = '+56962614851';

-- 6. Verificar resultado
SELECT id, name, email, phone FROM profiles WHERE phone = '+56962614851';
