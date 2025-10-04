-- Script para crear la tabla user_addresses

-- 1. Crear la tabla user_addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20),
  instructions TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(user_id, is_default);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de seguridad

-- Permitir a los usuarios ver sus propias direcciones
CREATE POLICY "Users can view own addresses" ON user_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir a los usuarios insertar sus propias direcciones
CREATE POLICY "Users can insert own addresses" ON user_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir a los usuarios actualizar sus propias direcciones
CREATE POLICY "Users can update own addresses" ON user_addresses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir a los usuarios eliminar sus propias direcciones
CREATE POLICY "Users can delete own addresses" ON user_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para actualizar updated_at
CREATE TRIGGER trigger_update_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_addresses_updated_at();

-- 7. Verificar que la tabla se creó correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_addresses'
ORDER BY ordinal_position;

-- 8. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_addresses';

SELECT '✅ Tabla user_addresses creada exitosamente con RLS habilitado' as resultado;


