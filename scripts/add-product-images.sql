-- =============================================
-- AGREGAR IMÁGENES REALES A PRODUCTOS EXISTENTES
-- =============================================

-- Actualizar productos de TechStore con imágenes reales
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80'
WHERE name = 'iPhone 14 Pro';

UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1505740420928-5e560c06f2e0?auto=format&fit=crop&w=400&q=80'
WHERE name = 'AirPods Pro';

UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&q=80'
WHERE name = 'Power Bank 10000mAh';

-- Actualizar productos de Minimarket La Esquina con imágenes reales
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80'
WHERE name = 'Cachapa con Queso';

UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1590985926192-95b8b05445d2?auto=format&fit=crop&w=400&q=80'
WHERE name = 'Empanada de Carne';

UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&q=80'
WHERE name = 'Arepa Reina Pepiada';

-- Actualizar productos de Restaurante El Buen Sabor con imágenes reales
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&q=80'
WHERE name = 'Asador de Pollo';

UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'
WHERE name = 'Parrillada Familiar';

-- Insertar más productos con imágenes para tener más ofertas
INSERT INTO public.products (id, name, description, price_cents, image_url, category, status) VALUES
-- Más productos de TechStore
(
    'prod-tech-004',
    'MacBook Air M2',
    'Laptop ultradelgada con chip M2',
    1299000,
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=400&q=80',
    'Tecnología',
    'active'
),
(
    'prod-tech-005',
    'Samsung Galaxy S23',
    'Smartphone Android de última generación',
    699000,
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
    'Tecnología',
    'active'
),
-- Más productos de Minimarket La Esquina
(
    'prod-food-004',
    'Tequeños',
    'Palitos de queso envueltos en masa',
    2000,
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
),
(
    'prod-food-005',
    'Pabellón Criollo',
    'Plato tradicional venezolano',
    4500,
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
),
-- Más productos de Restaurante El Buen Sabor
(
    'prod-rest-003',
    'Hamburguesa Artesanal',
    'Hamburguesa con ingredientes frescos',
    5500,
    'https://images.unsplash.com/photo-1568901346379-8ce8c6c89597?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
),
(
    'prod-rest-004',
    'Pizza Margherita',
    'Pizza tradicional italiana',
    7500,
    'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
);

-- Conectar los nuevos productos con vendedores
INSERT INTO public.seller_products (seller_id, product_id, stock_quantity, is_active) VALUES
-- TechStore nuevos productos
('550e8400-e29b-41d4-a716-446655440001', 'prod-tech-004', 3, true),
('550e8400-e29b-41d4-a716-446655440001', 'prod-tech-005', 8, true),
-- Minimarket La Esquina nuevos productos
('550e8400-e29b-41d4-a716-446655440002', 'prod-food-004', 25, true),
('550e8400-e29b-41d4-a716-446655440002', 'prod-food-005', 12, true),
-- Restaurante El Buen Sabor nuevos productos
('550e8400-e29b-41d4-a716-446655440003', 'prod-rest-003', 15, true),
('550e8400-e29b-41d4-a716-446655440003', 'prod-rest-004', 10, true);












