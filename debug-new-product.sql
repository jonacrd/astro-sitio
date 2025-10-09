-- Script para verificar por qué un producto recién creado no aparece en el feed

-- 1. Verificar productos creados recientemente (últimas 24 horas)
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.image_url,
    p.created_by,
    p.created_at,
    sp.seller_id,
    sp.price_cents,
    sp.stock,
    sp.active,
    sp.inventory_mode,
    pr.name as seller_name,
    pr.is_active as seller_active,
    pr.is_seller
FROM products p
LEFT JOIN seller_products sp ON p.id = sp.product_id
LEFT JOIN profiles pr ON sp.seller_id = pr.id
WHERE p.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY p.created_at DESC;

-- 2. Verificar productos que deberían aparecer en el feed (criterios del feed)
SELECT 
    p.id,
    p.title,
    p.category,
    sp.seller_id,
    sp.price_cents,
    sp.stock,
    sp.active,
    pr.name as seller_name,
    pr.is_active as seller_active,
    pr.is_seller,
    CASE 
        WHEN sp.active = true AND sp.stock > 0 AND pr.is_active = true AND pr.is_seller = true 
        THEN 'APARECE EN FEED'
        ELSE 'NO APARECE EN FEED'
    END as feed_status
FROM products p
LEFT JOIN seller_products sp ON p.id = sp.product_id
LEFT JOIN profiles pr ON sp.seller_id = pr.id
WHERE p.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY p.created_at DESC;

-- 3. Verificar si hay productos con created_by (productos personalizados)
SELECT 
    COUNT(*) as total_custom_products,
    COUNT(CASE WHEN sp.active = true THEN 1 END) as active_custom_products,
    COUNT(CASE WHEN sp.stock > 0 THEN 1 END) as with_stock,
    COUNT(CASE WHEN pr.is_active = true THEN 1 END) as from_active_sellers
FROM products p
LEFT JOIN seller_products sp ON p.id = sp.product_id
LEFT JOIN profiles pr ON sp.seller_id = pr.id
WHERE p.created_by IS NOT NULL;

-- 4. Verificar el estado del vendedor actual
SELECT 
    id,
    name,
    email,
    is_seller,
    is_active,
    created_at
FROM profiles 
WHERE is_seller = true 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar productos por categoría (últimos creados)
SELECT 
    p.category,
    COUNT(*) as total_products,
    COUNT(CASE WHEN sp.active = true AND sp.stock > 0 AND pr.is_active = true THEN 1 END) as visible_in_feed
FROM products p
LEFT JOIN seller_products sp ON p.id = sp.product_id
LEFT JOIN profiles pr ON sp.seller_id = pr.id
WHERE p.created_at >= NOW() - INTERVAL '7 days'
GROUP BY p.category
ORDER BY total_products DESC;



