-- Script para diagnosticar por qué un vendedor no se encuentra

-- 1. Verificar si el vendedor existe en profiles
SELECT 
  id, 
  name, 
  is_seller, 
  is_active,
  created_at
FROM profiles 
WHERE id = '8f0a8848-8647-41e7-b9d0-323ee000d379';

-- 2. Verificar todos los vendedores
SELECT 
  id, 
  name, 
  is_seller, 
  is_active,
  created_at
FROM profiles 
WHERE is_seller = true;

-- 3. Verificar si el usuario existe en auth.users
SELECT 
  id, 
  email, 
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE id = '8f0a8848-8647-41e7-b9d0-323ee000d379';

-- 4. Verificar productos del vendedor
SELECT 
  sp.id,
  sp.seller_id,
  sp.active,
  sp.stock,
  p.title,
  p.category
FROM seller_products sp
JOIN products p ON sp.product_id = p.id
WHERE sp.seller_id = '8f0a8848-8647-41e7-b9d0-323ee000d379';

-- 5. Si el vendedor no tiene is_seller = true, actualizarlo
-- UPDATE profiles 
-- SET is_seller = true 
-- WHERE id = '8f0a8848-8647-41e7-b9d0-323ee000d379';


