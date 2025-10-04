-- Script para restaurar y activar TODOS los productos de Diego Ramírez

-- 1. Ver el ID de Diego
SELECT id, name FROM profiles WHERE name = 'Diego Ramírez';

-- 2. Ver TODOS sus productos (activos e inactivos)
SELECT 
  sp.seller_id,
  sp.product_id,
  p.title,
  p.category,
  sp.active,
  sp.stock,
  sp.price_cents
FROM seller_products sp
JOIN products p ON p.id = sp.product_id
WHERE sp.seller_id = (SELECT id FROM profiles WHERE name = 'Diego Ramírez')
ORDER BY sp.active DESC, p.category;

-- 3. ACTIVAR TODOS los productos de Diego
UPDATE seller_products 
SET active = true
WHERE seller_id = (SELECT id FROM profiles WHERE name = 'Diego Ramírez');

-- 4. Asegurar que tienen stock
UPDATE seller_products 
SET stock = GREATEST(stock, 20)
WHERE seller_id = (SELECT id FROM profiles WHERE name = 'Diego Ramírez');

-- 5. Actualizar categorías correctamente
UPDATE products SET category = 'comida_rapida' WHERE title ILIKE '%emapanada%';
UPDATE products SET category = 'panaderia' WHERE title ILIKE '%torta%';
UPDATE products SET category = 'abastos' WHERE title ILIKE '%aceite%' OR title ILIKE '%arroz%';
UPDATE products SET category = 'bebidas' WHERE title ILIKE '%cocacola%' OR title ILIKE '%watts%';
UPDATE products SET category = 'abastos' WHERE title ILIKE '%fideos%';

-- 6. Verificar resultado final
SELECT 
  pr.name as vendedor,
  p.title as producto,
  p.category as categoria,
  sp.active as activo,
  sp.stock as stock,
  sp.price_cents as precio
FROM seller_products sp
JOIN products p ON p.id = sp.product_id
JOIN profiles pr ON pr.id = sp.seller_id
WHERE sp.active = true AND sp.stock > 0
ORDER BY pr.name, p.category, p.title;


