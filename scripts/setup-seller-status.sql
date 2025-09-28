-- Crear tabla para el estado online/offline de vendedores
CREATE TABLE IF NOT EXISTS seller_status (
  seller_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  online BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_seller_status_online ON seller_status(online);

-- Habilitar RLS (Row Level Security)
ALTER TABLE seller_status ENABLE ROW LEVEL SECURITY;

-- Política para que los vendedores solo puedan ver y modificar su propio estado
CREATE POLICY "Sellers can manage their own status" ON seller_status
  FOR ALL USING (auth.uid() = seller_id);

-- Política para que otros usuarios puedan ver el estado online (para búsquedas)
CREATE POLICY "Anyone can view online status" ON seller_status
  FOR SELECT USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_seller_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_seller_status_updated_at
  BEFORE UPDATE ON seller_status
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_status_updated_at();

-- Insertar estado inicial para vendedores existentes
INSERT INTO seller_status (seller_id, online)
SELECT 
  id as seller_id,
  false as online
FROM profiles 
WHERE is_seller = true
ON CONFLICT (seller_id) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE seller_status IS 'Estado online/offline de vendedores';
COMMENT ON COLUMN seller_status.seller_id IS 'ID del vendedor';
COMMENT ON COLUMN seller_status.online IS 'Estado online (true) o offline (false)';
COMMENT ON COLUMN seller_status.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN seller_status.updated_at IS 'Fecha de última actualización';
