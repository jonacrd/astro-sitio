-- Script para diagnosticar problemas con creación de productos personalizados

-- 1. Verificar estructura de la tabla products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla seller_products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'seller_products' 
ORDER BY ordinal_position;

-- 3. Verificar si existe la columna created_by en products
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'products' AND column_name = 'created_by'
) AS has_created_by_column;

-- 4. Verificar si existen las columnas de inventory_mode en seller_products
SELECT 
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_products' AND column_name = 'inventory_mode') AS has_inventory_mode,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_products' AND column_name = 'available_today') AS has_available_today,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_products' AND column_name = 'portion_limit') AS has_portion_limit,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_products' AND column_name = 'portion_used') AS has_portion_used,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_products' AND column_name = 'sold_out') AS has_sold_out;

-- 5. Verificar RLS policies en products
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products';

-- 6. Verificar RLS policies en seller_products
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'seller_products';

-- 7. Verificar si hay productos creados por vendedores
SELECT 
  p.id,
  p.title,
  p.category,
  p.created_by,
  sp.seller_id,
  sp.price_cents,
  sp.stock,
  sp.active,
  pr.name as seller_name
FROM products p
LEFT JOIN seller_products sp ON p.id = sp.product_id
LEFT JOIN profiles pr ON sp.seller_id = pr.id
WHERE p.created_by IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- 8. Contar productos por vendedor
SELECT 
  pr.name as seller_name,
  COUNT(p.id) as total_products,
  COUNT(CASE WHEN sp.active = true THEN 1 END) as active_products
FROM profiles pr
LEFT JOIN seller_products sp ON pr.id = sp.seller_id
LEFT JOIN products p ON sp.product_id = p.id
WHERE pr.is_seller = true
GROUP BY pr.id, pr.name
ORDER BY total_products DESC;



