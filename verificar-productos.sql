-- Script para verificar productos en la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los productos disponibles
SELECT 
  p.id,
  p.title,
  p.category,
  p.description,
  sp.seller_id,
  sp.price_cents,
  sp.stock,
  sp.active,
  pr.name as seller_name
FROM products p
JOIN seller_products sp ON p.id = sp.product_id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.active = true
ORDER BY p.title;

-- 2. Buscar específicamente pizza y perros calientes
SELECT 
  p.id,
  p.title,
  p.category,
  sp.seller_id,
  sp.price_cents,
  sp.stock,
  sp.active,
  pr.name as seller_name
FROM products p
JOIN seller_products sp ON p.id = sp.product_id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.active = true 
  AND (
    LOWER(p.title) LIKE '%pizza%' OR 
    LOWER(p.title) LIKE '%perro%' OR 
    LOWER(p.title) LIKE '%hot dog%' OR
    LOWER(p.title) LIKE '%hamburguesa%' OR
    LOWER(p.title) LIKE '%cerveza%'
  )
ORDER BY p.title;

-- 3. Contar productos por categoría
SELECT 
  p.category,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN sp.active = true THEN 1 END) as productos_activos
FROM products p
JOIN seller_products sp ON p.id = sp.product_id
GROUP BY p.category
ORDER BY total_productos DESC;

-- 4. Verificar vendedores activos
SELECT 
  id,
  name,
  is_seller,
  is_active
FROM profiles 
WHERE is_seller = true
ORDER BY name;


