-- Script para arreglar el esquema de base de datos para creación de productos personalizados

-- 1. Agregar columna created_by a products si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE products ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Columna created_by agregada a products';
    ELSE
        RAISE NOTICE 'Columna created_by ya existe en products';
    END IF;
END $$;

-- 2. Agregar columnas de inventory_mode a seller_products si no existen
DO $$ 
BEGIN
    -- inventory_mode
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' AND column_name = 'inventory_mode'
    ) THEN
        ALTER TABLE seller_products ADD COLUMN inventory_mode TEXT DEFAULT 'count' CHECK (inventory_mode IN ('count', 'availability'));
        RAISE NOTICE 'Columna inventory_mode agregada a seller_products';
    ELSE
        RAISE NOTICE 'Columna inventory_mode ya existe en seller_products';
    END IF;

    -- available_today
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' AND column_name = 'available_today'
    ) THEN
        ALTER TABLE seller_products ADD COLUMN available_today BOOLEAN;
        RAISE NOTICE 'Columna available_today agregada a seller_products';
    ELSE
        RAISE NOTICE 'Columna available_today ya existe en seller_products';
    END IF;

    -- portion_limit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' AND column_name = 'portion_limit'
    ) THEN
        ALTER TABLE seller_products ADD COLUMN portion_limit INTEGER;
        RAISE NOTICE 'Columna portion_limit agregada a seller_products';
    ELSE
        RAISE NOTICE 'Columna portion_limit ya existe en seller_products';
    END IF;

    -- portion_used
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' AND column_name = 'portion_used'
    ) THEN
        ALTER TABLE seller_products ADD COLUMN portion_used INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna portion_used agregada a seller_products';
    ELSE
        RAISE NOTICE 'Columna portion_used ya existe en seller_products';
    END IF;

    -- sold_out
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' AND column_name = 'sold_out'
    ) THEN
        ALTER TABLE seller_products ADD COLUMN sold_out BOOLEAN;
        RAISE NOTICE 'Columna sold_out agregada a seller_products';
    ELSE
        RAISE NOTICE 'Columna sold_out ya existe en seller_products';
    END IF;
END $$;

-- 3. Actualizar RLS policies para products si es necesario
DO $$
BEGIN
    -- Verificar si existe policy para insertar productos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Users can insert products'
    ) THEN
        CREATE POLICY "Users can insert products" ON products
        FOR INSERT WITH CHECK (auth.uid() = created_by);
        RAISE NOTICE 'Policy de INSERT agregada a products';
    ELSE
        RAISE NOTICE 'Policy de INSERT ya existe en products';
    END IF;

    -- Verificar si existe policy para actualizar productos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Users can update their products'
    ) THEN
        CREATE POLICY "Users can update their products" ON products
        FOR UPDATE USING (auth.uid() = created_by);
        RAISE NOTICE 'Policy de UPDATE agregada a products';
    ELSE
        RAISE NOTICE 'Policy de UPDATE ya existe en products';
    END IF;

    -- Verificar si existe policy para eliminar productos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Users can delete their products'
    ) THEN
        CREATE POLICY "Users can delete their products" ON products
        FOR DELETE USING (auth.uid() = created_by);
        RAISE NOTICE 'Policy de DELETE agregada a products';
    ELSE
        RAISE NOTICE 'Policy de DELETE ya existe en products';
    END IF;
END $$;

-- 4. Verificar que RLS esté habilitado
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;

-- 5. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_seller_products_inventory_mode ON seller_products(inventory_mode);
CREATE INDEX IF NOT EXISTS idx_seller_products_available_today ON seller_products(available_today);

-- 6. Verificar estructura final
SELECT 'products' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
UNION ALL
SELECT 'seller_products' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'seller_products'
ORDER BY table_name, column_name;
