-- Script para poblar la base de datos con datos de prueba
-- Ejecutar en Supabase SQL Editor

-- 1. Crear vendedores en profiles (si no existen)
INSERT INTO profiles (id, name, phone, is_seller) VALUES
('00000000-0000-0000-0000-000000000001', 'María González', '1234567890', true),
('00000000-0000-0000-0000-000000000002', 'Carlos Rodríguez', '0987654321', true),
('00000000-0000-0000-0000-000000000003', 'Ana Martínez', '1122334455', true),
('00000000-0000-0000-0000-000000000004', 'Luis Pérez', '5566778899', true),
('00000000-0000-0000-0000-000000000005', 'Sofia Herrera', '9988776655', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  is_seller = EXCLUDED.is_seller;

-- 2. Crear estados de vendedores en seller_status
INSERT INTO seller_status (seller_id, online, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', true, NOW()),
('00000000-0000-0000-0000-000000000002', true, NOW()),
('00000000-0000-0000-0000-000000000003', false, NOW()),
('00000000-0000-0000-0000-000000000004', true, NOW()),
('00000000-0000-0000-0000-000000000005', true, NOW())
ON CONFLICT (seller_id) DO UPDATE SET
  online = EXCLUDED.online,
  updated_at = EXCLUDED.updated_at;

-- 3. Crear productos en seller_products (relacionando vendedores con productos existentes)
-- Primero obtenemos algunos productos existentes
WITH sample_products AS (
  SELECT id, title, category FROM products LIMIT 20
)
INSERT INTO seller_products (seller_id, product_id, price_cents, stock, active) 
SELECT 
  '00000000-0000-0000-0000-000000000001' as seller_id,
  sp.id,
  CASE 
    WHEN sp.category = 'comida' THEN 1500 + (random() * 1000)::int
    WHEN sp.category = 'bebidas' THEN 800 + (random() * 500)::int
    WHEN sp.category = 'minimarket' THEN 2000 + (random() * 2000)::int
    WHEN sp.category = 'ropa' THEN 5000 + (random() * 10000)::int
    WHEN sp.category = 'tecnologia' THEN 15000 + (random() * 20000)::int
    WHEN sp.category = 'servicios' THEN 3000 + (random() * 5000)::int
    ELSE 1000 + (random() * 2000)::int
  END as price_cents,
  (10 + (random() * 50))::int as stock,
  true as active
FROM sample_products sp
WHERE sp.id IN (
  SELECT id FROM products WHERE category = 'comida' LIMIT 5
);

-- Vendedor 2 - bebidas
WITH sample_products AS (
  SELECT id, title, category FROM products WHERE category = 'bebidas' LIMIT 5
)
INSERT INTO seller_products (seller_id, product_id, price_cents, stock, active) 
SELECT 
  '00000000-0000-0000-0000-000000000002' as seller_id,
  sp.id,
  800 + (random() * 500)::int as price_cents,
  (10 + (random() * 30))::int as stock,
  true as active
FROM sample_products sp;

-- Vendedor 3 - minimarket
WITH sample_products AS (
  SELECT id, title, category FROM products WHERE category = 'minimarket' LIMIT 5
)
INSERT INTO seller_products (seller_id, product_id, price_cents, stock, active) 
SELECT 
  '00000000-0000-0000-0000-000000000003' as seller_id,
  sp.id,
  2000 + (random() * 2000)::int as price_cents,
  (5 + (random() * 25))::int as stock,
  true as active
FROM sample_products sp;

-- Vendedor 4 - ropa
WITH sample_products AS (
  SELECT id, title, category FROM products WHERE category = 'ropa' LIMIT 5
)
INSERT INTO seller_products (seller_id, product_id, price_cents, stock, active) 
SELECT 
  '00000000-0000-0000-0000-000000000004' as seller_id,
  sp.id,
  5000 + (random() * 10000)::int as price_cents,
  (3 + (random() * 15))::int as stock,
  true as active
FROM sample_products sp;

-- Vendedor 5 - tecnologia
WITH sample_products AS (
  SELECT id, title, category FROM products WHERE category = 'tecnologia' LIMIT 5
)
INSERT INTO seller_products (seller_id, product_id, price_cents, stock, active) 
SELECT 
  '00000000-0000-0000-0000-000000000005' as seller_id,
  sp.id,
  15000 + (random() * 20000)::int as price_cents,
  (2 + (random() * 8))::int as stock,
  true as active
FROM sample_products sp;

-- 4. Verificar datos insertados
SELECT 'Vendedores creados:' as info, COUNT(*) as count FROM profiles WHERE is_seller = true;
SELECT 'Estados de vendedores:' as info, COUNT(*) as count FROM seller_status;
SELECT 'Productos por vendedor:' as info, COUNT(*) as count FROM seller_products;
SELECT 'Productos activos:' as info, COUNT(*) as count FROM seller_products WHERE active = true;







