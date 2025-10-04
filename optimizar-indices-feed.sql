-- Script para optimizar índices de la base de datos para el feed
-- Esto mejorará significativamente el rendimiento de las queries

-- 1. Índice compuesto para seller_products (el más importante)
CREATE INDEX IF NOT EXISTS idx_seller_products_feed_optimized 
ON seller_products (active, stock) 
WHERE active = true AND stock > 0;

-- 2. Índice para filtrar por vendedor activo
CREATE INDEX IF NOT EXISTS idx_profiles_seller_active 
ON profiles (is_active) 
WHERE is_seller = true;

-- 3. Índice para productos por categoría
CREATE INDEX IF NOT EXISTS idx_products_category 
ON products (category);

-- 4. Índice para búsqueda de productos
CREATE INDEX IF NOT EXISTS idx_products_search 
ON products USING gin(to_tsvector('spanish', title || ' ' || description));

-- 5. Índice para seller_products por vendedor (para dashboard)
CREATE INDEX IF NOT EXISTS idx_seller_products_by_seller 
ON seller_products (seller_id);

-- 6. Índice para order_items por pedido (para optimizar consultas de pedidos)
CREATE INDEX IF NOT EXISTS idx_order_items_by_order 
ON order_items (order_id);

-- 7. Índice para orders por vendedor (para dashboard de vendedores)
CREATE INDEX IF NOT EXISTS idx_orders_by_seller 
ON orders (seller_id);

-- 8. Estadísticas actualizadas para el optimizador de consultas
ANALYZE seller_products;
ANALYZE products;
ANALYZE profiles;
ANALYZE orders;
ANALYZE order_items;

-- 9. Verificar índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('seller_products', 'products', 'profiles', 'orders', 'order_items')
ORDER BY tablename, indexname;
