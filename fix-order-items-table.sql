-- Script para verificar y corregir la estructura de order_items

-- 1. Verificar la estructura actual de order_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 2. Si la columna quantity no existe, agregarla
-- (Si ya existe, esta línea dará error pero no afectará)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- 3. Si la columna qty existe pero se llama diferente, renombrarla
-- Descomentar si es necesario:
-- ALTER TABLE order_items RENAME COLUMN qty TO quantity;

-- 4. Verificar la estructura después de los cambios
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;



