-- Script para arreglar available_today para productos de modo availability

-- 1. Verificar productos de modo availability con available_today = false
SELECT 
    sp.product_id,
    p.title,
    p.category,
    sp.inventory_mode,
    sp.available_today,
    sp.sold_out,
    sp.stock,
    sp.active,
    pr.name as seller_name
FROM seller_products sp
JOIN products p ON sp.product_id = p.id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.inventory_mode = 'availability'
ORDER BY p.created_at DESC;

-- 2. Actualizar available_today a true para productos de modo availability que están activos
UPDATE seller_products 
SET available_today = true
WHERE inventory_mode = 'availability' 
  AND active = true 
  AND (available_today IS NULL OR available_today = false);

-- 3. Verificar que se actualizó correctamente
SELECT 
    sp.product_id,
    p.title,
    p.category,
    sp.inventory_mode,
    sp.available_today,
    sp.sold_out,
    sp.stock,
    sp.active,
    pr.name as seller_name
FROM seller_products sp
JOIN products p ON sp.product_id = p.id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.inventory_mode = 'availability'
ORDER BY p.created_at DESC;

-- 4. Verificar que ahora aparecen en el feed (simulando la query del feed)
SELECT 
    sp.product_id,
    p.title,
    p.category,
    sp.inventory_mode,
    sp.available_today,
    sp.sold_out,
    sp.stock,
    sp.active,
    pr.name as seller_name,
    pr.is_active as seller_active
FROM seller_products sp
JOIN products p ON sp.product_id = p.id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE sp.active = true 
  AND pr.is_active = true 
  AND pr.is_seller = true
  AND (
    (sp.inventory_mode = 'count' AND sp.stock > 0) 
    OR 
    (sp.inventory_mode = 'availability' AND sp.available_today = true AND sp.sold_out = false)
  )
ORDER BY sp.product_id DESC;
