-- Script urgente para solucionar errores del feed

-- 1. Agregar columna gender a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- 2. Agregar columnas de inventory_mode a seller_products
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS inventory_mode VARCHAR(20) DEFAULT 'count';
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS available_today BOOLEAN DEFAULT true;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS sold_out BOOLEAN DEFAULT false;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS portion_limit INTEGER;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS portion_used INTEGER DEFAULT 0;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS prep_minutes INTEGER;

-- 3. Actualizar productos existentes
UPDATE seller_products SET inventory_mode = 'count' WHERE inventory_mode IS NULL;
UPDATE seller_products SET available_today = true WHERE available_today IS NULL;
UPDATE seller_products SET sold_out = false WHERE sold_out IS NULL;
UPDATE seller_products SET portion_used = 0 WHERE portion_used IS NULL;

-- 4. Verificar que se crearon las columnas
SELECT 'profiles' as tabla, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'gender'
UNION ALL
SELECT 'seller_products' as tabla, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'seller_products' 
  AND column_name IN ('inventory_mode', 'available_today', 'sold_out', 'portion_limit', 'portion_used', 'prep_minutes')
ORDER BY tabla, column_name;


