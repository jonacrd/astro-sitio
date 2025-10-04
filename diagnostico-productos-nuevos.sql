-- Script para diagnosticar por qué los productos nuevos no aparecen en el feed

-- 1. Ver todos los productos en seller_products (últimos 10)
SELECT 
  sp.seller_id,
  sp.product_id,
  sp.price_cents,
  sp.stock,
  sp.active,
  p.title,
  p.category,
  pr.name as seller_name,
  pr.is_active as seller_active,
  p.created_at
FROM seller_products sp
JOIN products p ON sp.product_id = p.id
JOIN profiles pr ON sp.seller_id = pr.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 2. Ver productos que NO aparecen en el feed (inactivos o sin stock)
SELECT 
  sp.seller_id,
  sp.product_id,
  sp.price_cents,
  sp.stock,
  sp.active,
  p.title,
  p.category,
  pr.name as seller_name,
  pr.is_active as seller_active,
  CASE 
    WHEN sp.active = false THEN 'Producto inactivo'
    WHEN sp.stock <= 0 THEN 'Sin stock'
    WHEN pr.is_active = false THEN 'Vendedor inactivo'
    ELSE 'Otro motivo'
  END as motivo_no_aparece
FROM seller_products sp
JOIN products p ON sp.product_id = p.id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.active = false 
   OR sp.stock <= 0 
   OR pr.is_active = false
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Ver productos que SÍ aparecen en el feed
SELECT 
  sp.seller_id,
  sp.product_id,
  sp.price_cents,
  sp.stock,
  sp.active,
  p.title,
  p.category,
  pr.name as seller_name,
  pr.is_active as seller_active
FROM seller_products sp
JOIN products p ON sp.product_id = p.id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.active = true 
  AND sp.stock > 0 
  AND pr.is_active = true
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Contar productos por estado
SELECT 
  'Total productos' as tipo,
  COUNT(*) as cantidad
FROM seller_products
UNION ALL
SELECT 
  'Productos activos' as tipo,
  COUNT(*) as cantidad
FROM seller_products
WHERE active = true
UNION ALL
SELECT 
  'Productos con stock' as tipo,
  COUNT(*) as cantidad
FROM seller_products
WHERE stock > 0
UNION ALL
SELECT 
  'Productos que aparecen en feed' as tipo,
  COUNT(*) as cantidad
FROM seller_products sp
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.active = true 
  AND sp.stock > 0 
  AND pr.is_active = true;
