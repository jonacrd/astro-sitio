-- Script para actualizar el campo 'gender' de los perfiles
-- basándose en los metadatos de Google (si iniciaron sesión con Google)

-- Agregar columna 'gender' a 'profiles' si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Actualizar 'gender' desde los metadatos de autenticación de Google
-- Este script debe ejecutarse manualmente ya que los metadatos están en auth.users
-- que no es directamente accesible desde SQL en Supabase

-- En su lugar, el gender se actualizará automáticamente desde el frontend
-- cuando el usuario inicie sesión, usando LoginForm.tsx

-- Para actualizar manualmente un usuario específico:
-- UPDATE profiles 
-- SET gender = 'male' -- o 'female'
-- WHERE id = 'user-uuid-here';

-- Ver usuarios que no tienen gender definido:
SELECT 
  p.id,
  p.name,
  p.email,
  p.is_seller,
  p.gender,
  p.avatar_url
FROM profiles p
WHERE p.gender IS NULL OR p.gender = '';



