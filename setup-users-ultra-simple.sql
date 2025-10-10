-- Script ultra-simple para configurar WhatsApp
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estructura de profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Ver usuarios existentes (sin role)
SELECT id, name, phone FROM profiles LIMIT 20;

-- 3. Actualizar TODOS los usuarios con el número de WhatsApp
UPDATE profiles 
SET phone = '+56962614851';

-- 4. Verificar estructura de couriers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'couriers' 
ORDER BY ordinal_position;

-- 5. Ver couriers existentes
SELECT * FROM couriers LIMIT 10;

-- 6. Actualizar TODOS los couriers con el número de WhatsApp
UPDATE couriers 
SET phone = '+56962614851';

-- 7. Verificar resultado
SELECT 'profiles' as tabla, id, name, phone FROM profiles WHERE phone = '+56962614851'
UNION ALL
SELECT 'couriers' as tabla, id, name, phone FROM couriers WHERE phone = '+56962614851';



