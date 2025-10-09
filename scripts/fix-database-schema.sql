-- Script SQL para corregir la estructura de la base de datos
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Agregar columna id a seller_products si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE seller_products ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;
END $$;

-- 2. Hacer id la clave primaria si no lo es
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'seller_products' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE seller_products ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 3. Agregar columna created_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE seller_products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_seller_products_seller_id ON seller_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_product_id ON seller_products(product_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_active ON seller_products(active);

-- 5. Habilitar RLS en seller_products
ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS para seller_products
DROP POLICY IF EXISTS "Users can view their own seller products" ON seller_products;
CREATE POLICY "Users can view their own seller products" ON seller_products
    FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert their own seller products" ON seller_products;
CREATE POLICY "Users can insert their own seller products" ON seller_products
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update their own seller products" ON seller_products;
CREATE POLICY "Users can update their own seller products" ON seller_products
    FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can delete their own seller products" ON seller_products;
CREATE POLICY "Users can delete their own seller products" ON seller_products
    FOR DELETE USING (auth.uid() = seller_id);

-- 7. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_seller_products_updated_at ON seller_products;
CREATE TRIGGER update_seller_products_updated_at
    BEFORE UPDATE ON seller_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();











