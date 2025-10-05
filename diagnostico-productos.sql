-- Script de diagnóstico para ver todos los productos disponibles

-- 1. Ver todos los vendedores
SELECT id, name, is_seller, created_at 
FROM profiles 
WHERE is_seller = true 
ORDER BY name;

-- 2. Ver TODOS los productos en el catálogo general
SELECT id, title, category, active, created_at 
FROM products 
ORDER BY category, title;

-- 3. Ver productos de TECHSTORE (o cualquier vendedor)
-- Primero obtener el ID de techstore
SELECT p.id as profile_id, p.name, p.is_seller
FROM profiles p
WHERE p.name ILIKE '%techstore%' OR p.name ILIKE '%tech%';

-- 4. Ver productos activos e inactivos de TODOS los vendedores
SELECT 
  pr.name as vendedor,
  p.title as producto,
  p.category as categoria,
  sp.stock as stock,
  sp.active as activo,
  sp.price_cents as precio
FROM seller_products sp
JOIN products p ON p.id = sp.product_id
JOIN profiles pr ON pr.id = sp.seller_id
ORDER BY pr.name, sp.active DESC, p.title;

-- 5. Contar productos por vendedor
SELECT 
  pr.name as vendedor,
  COUNT(*) as total_productos,
  SUM(CASE WHEN sp.active = true THEN 1 ELSE 0 END) as productos_activos,
  SUM(CASE WHEN sp.active = false THEN 1 ELSE 0 END) as productos_inactivos
FROM seller_products sp
JOIN profiles pr ON pr.id = sp.seller_id
GROUP BY pr.name
ORDER BY total_productos DESC;

-- 6. Ver productos con stock > 0 y activos
SELECT 
  pr.name as vendedor,
  p.title as producto,
  p.category as categoria,
  sp.stock as stock,
  sp.price_cents as precio
FROM seller_products sp
JOIN products p ON p.id = sp.product_id
JOIN profiles pr ON pr.id = sp.seller_id
WHERE sp.active = true AND sp.stock > 0
ORDER BY pr.name, p.category, p.title;



