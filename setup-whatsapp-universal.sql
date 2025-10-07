-- Script universal para configurar WhatsApp
-- Ejecutar en Supabase SQL Editor PASO A PASO

-- PASO 1: Ver estructura de la tabla profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- PASO 2: Ver todos los usuarios (sin email)
SELECT id, name, phone FROM profiles LIMIT 20;

-- PASO 3: Actualizar TODOS los usuarios con el número de WhatsApp
UPDATE profiles 
SET phone = '+56962614851';

-- PASO 4: Verificar resultado
SELECT id, name, phone FROM profiles WHERE phone = '+56962614851';

-- PASO 5: Ver estructura de couriers (si existe)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'couriers' 
ORDER BY ordinal_position;

-- PASO 6: Actualizar couriers (si existe la tabla)
UPDATE couriers 
SET phone = '+56962614851';

-- PASO 7: Verificar couriers
SELECT id, name, phone FROM couriers WHERE phone = '+56962614851';
