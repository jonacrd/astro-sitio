-- Verificar estado del sistema de delivery
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si las tablas existen
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'delivery_offers' THEN '✅ Tabla delivery_offers existe'
    WHEN table_name = 'couriers' THEN '✅ Tabla couriers existe'
    ELSE '❓ Tabla: ' || table_name
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('delivery_offers', 'couriers', 'orders')
ORDER BY table_name;

-- 2. Contar registros en cada tabla
SELECT 'delivery_offers' as tabla, COUNT(*) as count FROM delivery_offers
UNION ALL
SELECT 'couriers' as tabla, COUNT(*) as count FROM couriers
UNION ALL
SELECT 'orders' as tabla, COUNT(*) as count FROM orders;

-- 3. Ver estructura de tabla couriers
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'couriers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Ver estructura de tabla delivery_offers
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'delivery_offers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
