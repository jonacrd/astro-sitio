-- Script para crear tabla de secciones personalizadas del vendedor
-- Permite a los vendedores crear secciones como "Más vendidos", "Caseros", etc.

-- Crear tabla para secciones personalizadas
CREATE TABLE IF NOT EXISTS seller_custom_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  product_ids TEXT[] DEFAULT '{}', -- Array de IDs de productos
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_seller_custom_sections_seller_id ON seller_custom_sections(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_custom_sections_active ON seller_custom_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_seller_custom_sections_order ON seller_custom_sections(seller_id, order_index);

-- Habilitar RLS (Row Level Security)
ALTER TABLE seller_custom_sections ENABLE ROW LEVEL SECURITY;

-- Política: Los vendedores solo pueden ver/editar sus propias secciones
CREATE POLICY "Vendedores pueden gestionar sus propias secciones" ON seller_custom_sections
  FOR ALL USING (auth.uid() = seller_id);

-- Política: Cualquiera puede ver secciones activas (para el perfil público)
CREATE POLICY "Cualquiera puede ver secciones activas" ON seller_custom_sections
  FOR SELECT USING (is_active = true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_seller_custom_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_seller_custom_sections_updated_at
  BEFORE UPDATE ON seller_custom_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_custom_sections_updated_at();

-- Agregar campos adicionales al perfil del vendedor para el perfil público
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_hours VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS delivery_zone VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS minimum_order INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;

-- Comentarios para documentar los campos
COMMENT ON TABLE seller_custom_sections IS 'Secciones personalizadas que los vendedores pueden crear para organizar sus productos';
COMMENT ON COLUMN seller_custom_sections.name IS 'Nombre de la sección (ej: "Más vendidos", "Caseros", "Ofertas")';
COMMENT ON COLUMN seller_custom_sections.description IS 'Descripción opcional de la sección';
COMMENT ON COLUMN seller_custom_sections.product_ids IS 'Array de IDs de productos que pertenecen a esta sección';
COMMENT ON COLUMN seller_custom_sections.order_index IS 'Orden de visualización de las secciones';

COMMENT ON COLUMN profiles.business_hours IS 'Horarios de atención del vendedor (ej: "Lun-Vie 8:00-18:00")';
COMMENT ON COLUMN profiles.delivery_zone IS 'Zona de entrega (ej: "Barrio Centro, Zona Norte")';
COMMENT ON COLUMN profiles.minimum_order IS 'Pedido mínimo en centavos';
COMMENT ON COLUMN profiles.delivery_fee IS 'Costo de entrega en centavos';

-- Insertar algunas secciones de ejemplo para vendedores existentes
-- (Opcional: descomenta si quieres crear secciones de ejemplo)
/*
INSERT INTO seller_custom_sections (seller_id, name, description, order_index)
SELECT 
  id,
  'Más vendidos',
  'Nuestros productos más populares',
  1
FROM profiles 
WHERE is_seller = true
ON CONFLICT DO NOTHING;

INSERT INTO seller_custom_sections (seller_id, name, description, order_index)
SELECT 
  id,
  'Productos caseros',
  'Hechos con amor en casa',
  2
FROM profiles 
WHERE is_seller = true
ON CONFLICT DO NOTHING;
*/




