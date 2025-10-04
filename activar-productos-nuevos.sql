-- Script para activar productos nuevos que no aparecen en el feed

-- 1. Ver productos inactivos (últimos 10)
SELECT 
  sp.seller_id,
  sp.product_id,
  sp.price_cents,
  sp.stock,
  sp.active,
  p.title,
  p.category,
  pr.name as seller_name,
  sp.created_at
FROM seller_products sp
JOIN products p ON sp.product_id = p.id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.active = false
ORDER BY sp.created_at DESC
LIMIT 10;

-- 2. Activar productos inactivos que tienen stock
UPDATE seller_products 
SET active = true 
WHERE active = false 
  AND stock > 0;

-- 3. Verificar que se activaron
SELECT 
  'Productos activados' as accion,
  COUNT(*) as cantidad
FROM seller_products 
WHERE active = true;

-- 4. Ver productos que ahora deberían aparecer en el feed
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
ORDER BY sp.created_at DESC
LIMIT 10;
