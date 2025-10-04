-- Script para verificar el estado de los vendedores
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los vendedores y su estado
SELECT 
  id,
  name,
  is_seller,
  is_active,
  created_at
FROM profiles 
WHERE is_seller = true
ORDER BY name;

-- 2. Ver productos por vendedor y su estado
SELECT 
  pr.id as seller_id,
  pr.name as seller_name,
  pr.is_seller,
  pr.is_active as seller_active,
  COUNT(sp.product_id) as total_productos,
  COUNT(CASE WHEN sp.active = true THEN 1 END) as productos_activos,
  COUNT(CASE WHEN sp.stock > 0 THEN 1 END) as productos_con_stock
FROM profiles pr
LEFT JOIN seller_products sp ON pr.id = sp.seller_id
WHERE pr.is_seller = true
GROUP BY pr.id, pr.name, pr.is_seller, pr.is_active
ORDER BY pr.name;

-- 3. Ver productos específicos (pizza, perros calientes) y sus vendedores
SELECT 
  p.title,
  p.category,
  sp.price_cents,
  sp.stock,
  sp.active as producto_activo,
  pr.name as seller_name,
  pr.is_active as seller_activo,
  pr.is_seller
FROM products p
JOIN seller_products sp ON p.id = sp.product_id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE (
  LOWER(p.title) LIKE '%pizza%' OR 
  LOWER(p.title) LIKE '%perro%' OR 
  LOWER(p.title) LIKE '%empanada%' OR
  LOWER(p.title) LIKE '%hamburguesa%'
)
ORDER BY p.title;

-- 4. Contar productos activos vs inactivos por vendedor
SELECT 
  pr.name as seller_name,
  pr.is_active as seller_activo,
  COUNT(CASE WHEN sp.active = true THEN 1 END) as productos_activos,
  COUNT(CASE WHEN sp.active = false THEN 1 END) as productos_inactivos,
  COUNT(CASE WHEN sp.stock > 0 THEN 1 END) as productos_con_stock,
  COUNT(CASE WHEN sp.stock = 0 THEN 1 END) as productos_sin_stock
FROM profiles pr
LEFT JOIN seller_products sp ON pr.id = sp.seller_id
WHERE pr.is_seller = true
GROUP BY pr.id, pr.name, pr.is_active
ORDER BY productos_activos DESC;

-- 5. Verificar si hay vendedores inactivos con productos activos
SELECT 
  pr.name as seller_name,
  pr.is_active as seller_activo,
  COUNT(sp.product_id) as total_productos,
  COUNT(CASE WHEN sp.active = true THEN 1 END) as productos_activos
FROM profiles pr
JOIN seller_products sp ON pr.id = sp.seller_id
WHERE pr.is_seller = true 
  AND pr.is_active = false
  AND sp.active = true
GROUP BY pr.id, pr.name, pr.is_active
ORDER BY productos_activos DESC;
