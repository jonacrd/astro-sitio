-- Agregar campo is_active a los perfiles de vendedor

-- 1. Agregar columna si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 2. Por defecto, todos los vendedores están activos
UPDATE profiles SET is_active = TRUE WHERE is_seller = TRUE;

-- 3. Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- 4. Verificar
SELECT id, name, is_seller, is_active FROM profiles WHERE is_seller = TRUE;





