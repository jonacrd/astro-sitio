-- Script para agregar las columnas faltantes que están causando errores

-- 1. Agregar columna 'gender' a 'profiles' si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- 2. Agregar columnas del sistema de inventario dual a 'seller_products'
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS inventory_mode VARCHAR(20) DEFAULT 'count';
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS available_today BOOLEAN DEFAULT true;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS portion_limit INTEGER;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS portion_used INTEGER DEFAULT 0;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS sold_out BOOLEAN DEFAULT false;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS last_available_on DATE;
ALTER TABLE seller_products ADD COLUMN IF NOT EXISTS prep_minutes INTEGER;

-- 3. Agregar columnas del perfil público a 'profiles'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_hours VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS delivery_zone VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS minimum_order INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;

-- 4. Crear tabla de secciones personalizadas si no existe
CREATE TABLE IF NOT EXISTS seller_custom_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  product_ids TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_seller_custom_sections_seller_id ON seller_custom_sections(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_custom_sections_active ON seller_custom_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_seller_custom_sections_order ON seller_custom_sections(seller_id, order_index);

-- 6. Habilitar RLS para seller_custom_sections
ALTER TABLE seller_custom_sections ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS para seller_custom_sections
DROP POLICY IF EXISTS "Vendedores pueden gestionar sus propias secciones" ON seller_custom_sections;
CREATE POLICY "Vendedores pueden gestionar sus propias secciones" ON seller_custom_sections
  FOR ALL USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Cualquiera puede ver secciones activas" ON seller_custom_sections;
CREATE POLICY "Cualquiera puede ver secciones activas" ON seller_custom_sections
  FOR SELECT USING (is_active = true);

-- 8. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_seller_custom_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_seller_custom_sections_updated_at ON seller_custom_sections;
CREATE TRIGGER trigger_update_seller_custom_sections_updated_at
  BEFORE UPDATE ON seller_custom_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_custom_sections_updated_at();

-- 10. Actualizar productos existentes para que tengan inventory_mode = 'count'
UPDATE seller_products 
SET inventory_mode = 'count' 
WHERE inventory_mode IS NULL;

-- 11. Verificar que las columnas se crearon correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('gender', 'business_hours', 'delivery_zone', 'minimum_order', 'delivery_fee')
ORDER BY column_name;

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'seller_products' 
  AND column_name IN ('inventory_mode', 'available_today', 'portion_limit', 'portion_used', 'sold_out', 'prep_minutes')
ORDER BY column_name;

-- 12. Verificar que la tabla seller_custom_sections existe
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'seller_custom_sections'
ORDER BY column_name;


