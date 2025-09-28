
-- Script para corregir la tabla seller_products
-- Verificar si la tabla existe y tiene la estructura correcta

-- 1. Verificar si existe la tabla
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_products') THEN
        -- Crear la tabla si no existe
        CREATE TABLE seller_products (
            id SERIAL PRIMARY KEY,
            seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            price_cents INTEGER NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            active BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(seller_id, product_id)
        );
        
        -- Crear índices
        CREATE INDEX idx_seller_products_seller_id ON seller_products(seller_id);
        CREATE INDEX idx_seller_products_product_id ON seller_products(product_id);
        CREATE INDEX idx_seller_products_active ON seller_products(active);
        
        -- Habilitar RLS
        ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas RLS
        CREATE POLICY "Users can view their own seller products" ON seller_products
            FOR SELECT USING (auth.uid() = seller_id);
            
        CREATE POLICY "Users can insert their own seller products" ON seller_products
            FOR INSERT WITH CHECK (auth.uid() = seller_id);
            
        CREATE POLICY "Users can update their own seller products" ON seller_products
            FOR UPDATE USING (auth.uid() = seller_id);
            
        CREATE POLICY "Users can delete their own seller products" ON seller_products
            FOR DELETE USING (auth.uid() = seller_id);
            
        -- Política para que todos puedan ver productos activos
        CREATE POLICY "Anyone can view active seller products" ON seller_products
            FOR SELECT USING (active = true);
            
        RAISE NOTICE 'Tabla seller_products creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla seller_products ya existe';
    END IF;
END $$;

-- 2. Verificar si existe la columna id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' AND column_name = 'id'
    ) THEN
        -- Agregar columna id si no existe
        ALTER TABLE seller_products ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Columna id agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna id ya existe';
    END IF;
END $$;

-- 3. Verificar si existe la restricción única
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'seller_products' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%seller_id%'
    ) THEN
        -- Agregar restricción única si no existe
        ALTER TABLE seller_products ADD CONSTRAINT seller_products_unique_seller_product 
        UNIQUE (seller_id, product_id);
        RAISE NOTICE 'Restricción única agregada exitosamente';
    ELSE
        RAISE NOTICE 'Restricción única ya existe';
    END IF;
END $$;

-- 4. Verificar si existen los índices
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'seller_products' 
        AND indexname = 'idx_seller_products_seller_id'
    ) THEN
        CREATE INDEX idx_seller_products_seller_id ON seller_products(seller_id);
        RAISE NOTICE 'Índice seller_id creado exitosamente';
    ELSE
        RAISE NOTICE 'Índice seller_id ya existe';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'seller_products' 
        AND indexname = 'idx_seller_products_product_id'
    ) THEN
        CREATE INDEX idx_seller_products_product_id ON seller_products(product_id);
        RAISE NOTICE 'Índice product_id creado exitosamente';
    ELSE
        RAISE NOTICE 'Índice product_id ya existe';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'seller_products' 
        AND indexname = 'idx_seller_products_active'
    ) THEN
        CREATE INDEX idx_seller_products_active ON seller_products(active);
        RAISE NOTICE 'Índice active creado exitosamente';
    ELSE
        RAISE NOTICE 'Índice active ya existe';
    END IF;
END $$;
