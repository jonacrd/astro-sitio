-- 🔧 Script para arreglar la tabla push_subscriptions
-- Ejecuta esto en Supabase SQL Editor

-- 1. Verificar si la tabla existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'push_subscriptions'
  ) THEN
    RAISE NOTICE '✅ La tabla push_subscriptions existe';
  ELSE
    RAISE NOTICE '❌ La tabla push_subscriptions NO existe - se creará';
  END IF;
END $$;

-- 2. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agregar constraint UNIQUE en user_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'push_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE push_subscriptions 
    ADD CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id);
    RAISE NOTICE '✅ Constraint UNIQUE agregado a user_id';
  ELSE
    RAISE NOTICE '✅ Constraint UNIQUE ya existe en user_id';
  END IF;
END $$;

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at 
ON push_subscriptions(created_at);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Users can insert their own push subscriptions." ON push_subscriptions;
DROP POLICY IF EXISTS "Users can view their own push subscriptions." ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions." ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions." ON push_subscriptions;

-- 7. Crear políticas RLS
CREATE POLICY "Users can insert their own push subscriptions."
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own push subscriptions."
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions."
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions."
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Crear trigger
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Verificar resultado final
SELECT 
  'Tabla configurada correctamente' as status,
  COUNT(*) as total_subscriptions
FROM push_subscriptions;

-- 11. Mostrar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'push_subscriptions'
ORDER BY ordinal_position;


