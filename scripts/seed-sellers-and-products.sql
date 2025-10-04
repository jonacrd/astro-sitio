-- =============================================
-- SEED SELLERS AND PRODUCTS - DATOS DE EJEMPLO
-- =============================================

-- Insertar vendedores
INSERT INTO public.sellers (id, user_id, name, description, status, phone, email, address) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM auth.users WHERE email = 'comprador3@gmail.com' LIMIT 1),
    'TechStore',
    'Tienda especializada en tecnología y gadgets',
    'online',
    '+56912345678',
    'techstore@example.com',
    'Av. Principal 123, Santiago'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM auth.users WHERE email = 'comprador3@gmail.com' LIMIT 1),
    'Minimarket La Esquina',
    'Minimarket con productos frescos y comida tradicional',
    'online',
    '+56987654321',
    'minimarket@example.com',
    'Calle Secundaria 456, Santiago'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM auth.users WHERE email = 'comprador3@gmail.com' LIMIT 1),
    'Restaurante El Buen Sabor',
    'Comida casera y asados tradicionales',
    'online',
    '+56911223344',
    'buensabor@example.com',
    'Plaza Central 789, Santiago'
);

-- Insertar productos de TechStore
INSERT INTO public.products (id, name, description, price_cents, image_url, category, status) VALUES
(
    'prod-tech-001',
    'iPhone 14 Pro',
    'Smartphone de última generación con cámara profesional',
    899000,
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80',
    'Tecnología',
    'active'
),
(
    'prod-tech-002',
    'AirPods Pro',
    'Audífonos inalámbricos con cancelación de ruido',
    199000,
    'https://images.unsplash.com/photo-1505740420928-5e560c06f2e0?auto=format&fit=crop&w=400&q=80',
    'Tecnología',
    'active'
),
(
    'prod-tech-003',
    'Power Bank 10000mAh',
    'Batería externa de alta capacidad con carga rápida',
    15000,
    'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&q=80',
    'Tecnología',
    'active'
);

-- Insertar productos de Minimarket La Esquina
INSERT INTO public.products (id, name, description, price_cents, image_url, category, status) VALUES
(
    'prod-food-001',
    'Cachapa con Queso',
    'Tradicional cachapa venezolana con queso fresco',
    3500,
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
),
(
    'prod-food-002',
    'Empanada de Carne',
    'Empanada casera de carne molida',
    1500,
    'https://images.unsplash.com/photo-1590985926192-95b8b05445d2?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
),
(
    'prod-food-003',
    'Arepa Reina Pepiada',
    'Arepa tradicional con pollo y aguacate',
    2500,
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
);

-- Insertar productos de Restaurante El Buen Sabor
INSERT INTO public.products (id, name, description, price_cents, image_url, category, status) VALUES
(
    'prod-rest-001',
    'Asador de Pollo',
    'Pollo entero asado con especias tradicionales',
    8000,
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
),
(
    'prod-rest-002',
    'Parrillada Familiar',
    'Parrillada para 4 personas con carnes y verduras',
    15000,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
    'Comida',
    'active'
);

-- Conectar productos con vendedores
INSERT INTO public.seller_products (seller_id, product_id, stock_quantity, is_active) VALUES
-- TechStore products
('550e8400-e29b-41d4-a716-446655440001', 'prod-tech-001', 5, true),
('550e8400-e29b-41d4-a716-446655440001', 'prod-tech-002', 10, true),
('550e8400-e29b-41d4-a716-446655440001', 'prod-tech-003', 15, true),
-- Minimarket La Esquina products
('550e8400-e29b-41d4-a716-446655440002', 'prod-food-001', 20, true),
('550e8400-e29b-41d4-a716-446655440002', 'prod-food-002', 30, true),
('550e8400-e29b-41d4-a716-446655440002', 'prod-food-003', 25, true),
-- Restaurante El Buen Sabor products
('550e8400-e29b-41d4-a716-446655440003', 'prod-rest-001', 8, true),
('550e8400-e29b-41d4-a716-446655440003', 'prod-rest-002', 5, true);








