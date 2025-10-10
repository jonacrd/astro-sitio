-- Verificar estructura de la tabla delivery_offers
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'delivery_offers' 
ORDER BY ordinal_position;

-- 2. Ver si la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'delivery_offers';

-- 3. Ver datos de la tabla (si existe)
SELECT * FROM delivery_offers LIMIT 5;

-- 4. Ver estructura de orders para comparar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;



