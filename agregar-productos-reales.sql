-- Script para agregar productos reales como pizza y perros calientes
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar productos de comida rápida
INSERT INTO products (id, title, description, category, image_url) VALUES
-- Pizzas
(gen_random_uuid(), 'Pizza Margherita', 'Deliciosa pizza margherita con tomate, mozzarella y albahaca fresca', 'Comida Rápida', '/images/products/comida-rapida/pizza-margherita.jpg'),
(gen_random_uuid(), 'Pizza Pepperoni', 'Pizza clásica con pepperoni, queso mozzarella y salsa de tomate', 'Comida Rápida', '/images/products/comida-rapida/pizza-pepperoni.jpg'),
(gen_random_uuid(), 'Pizza Hawaiana', 'Pizza con jamón, piña, queso mozzarella y salsa de tomate', 'Comida Rápida', '/images/products/comida-rapida/pizza-hawaiana.jpg'),
(gen_random_uuid(), 'Pizza Cuatro Quesos', 'Pizza con mozzarella, gorgonzola, parmesano y ricotta', 'Comida Rápida', '/images/products/comida-rapida/pizza-cuatro-quesos.jpg'),

-- Perros calientes
(gen_random_uuid(), 'Perro Caliente Clásico', 'Perro caliente con salchicha, cebolla, tomate y salsas', 'Comida Rápida', '/images/products/comida-rapida/perro-caliente-clasico.jpg'),
(gen_random_uuid(), 'Perro Caliente Especial', 'Perro caliente con salchicha premium, queso, bacon y salsas especiales', 'Comida Rápida', '/images/products/comida-rapida/perro-caliente-especial.jpg'),
(gen_random_uuid(), 'Perro Caliente Vegetariano', 'Perro caliente vegetariano con salchicha de soya y vegetales frescos', 'Comida Rápida', '/images/products/comida-rapida/perro-caliente-vegetariano.jpg'),

-- Hamburguesas
(gen_random_uuid(), 'Hamburguesa Clásica', 'Hamburguesa con carne, lechuga, tomate, cebolla y salsas', 'Comida Rápida', '/images/products/comida-rapida/hamburguesa-clasica.jpg'),
(gen_random_uuid(), 'Hamburguesa BBQ', 'Hamburguesa con carne, bacon, queso cheddar y salsa BBQ', 'Comida Rápida', '/images/products/comida-rapida/hamburguesa-bbq.jpg'),
(gen_random_uuid(), 'Hamburguesa Vegetariana', 'Hamburguesa vegetariana con patty de quinoa y vegetales frescos', 'Comida Rápida', '/images/products/comida-rapida/hamburguesa-vegetariana.jpg'),

-- Bebidas
(gen_random_uuid(), 'Coca Cola 500ml', 'Refrescante Coca Cola en botella de 500ml', 'Bebidas', '/images/products/bebidas/coca-cola-500ml.jpg'),
(gen_random_uuid(), 'Pepsi 500ml', 'Refrescante Pepsi en botella de 500ml', 'Bebidas', '/images/products/bebidas/pepsi-500ml.jpg'),
(gen_random_uuid(), 'Agua Natural 500ml', 'Agua natural purificada en botella de 500ml', 'Bebidas', '/images/products/bebidas/agua-natural-500ml.jpg'),

-- Servicios
(gen_random_uuid(), 'Corte de Cabello Masculino', 'Corte de cabello profesional para hombres', 'Servicios', '/images/products/servicios/corte-cabello-masculino.jpg'),
(gen_random_uuid(), 'Corte de Cabello Femenino', 'Corte y peinado profesional para mujeres', 'Servicios', '/images/products/servicios/corte-cabello-femenino.jpg'),
(gen_random_uuid(), 'Manicure Básica', 'Manicure básica con limpieza y esmaltado', 'Servicios', '/images/products/servicios/manicure-basica.jpg'),
(gen_random_uuid(), 'Pedicure Completa', 'Pedicure completa con limpieza, exfoliación y esmaltado', 'Servicios', '/images/products/servicios/pedicure-completa.jpg');

-- 2. Obtener IDs de vendedores existentes
-- (Estos IDs deben ser reemplazados por los IDs reales de tus vendedores)

-- 3. Agregar productos a seller_products para vendedores existentes
-- Reemplazar 'VENDEDOR_ID_1' y 'VENDEDOR_ID_2' con los IDs reales de tus vendedores

-- Para el primer vendedor (Minimarket La Esquina)
INSERT INTO seller_products (product_id, seller_id, price_cents, stock, active)
SELECT 
  p.id,
  'f3fb7f84-9c00-4f3f-b8b2-a3827f0b2ec7'::uuid, -- ID del Minimarket La Esquina
  CASE 
    WHEN p.title LIKE '%Pizza%' THEN 15000 -- $15.000
    WHEN p.title LIKE '%Perro%' THEN 8000  -- $8.000
    WHEN p.title LIKE '%Hamburguesa%' THEN 12000 -- $12.000
    WHEN p.title LIKE '%Coca%' OR p.title LIKE '%Pepsi%' THEN 3000 -- $3.000
    WHEN p.title LIKE '%Agua%' THEN 2000 -- $2.000
    WHEN p.title LIKE '%Corte%' THEN 25000 -- $25.000
    WHEN p.title LIKE '%Manicure%' THEN 15000 -- $15.000
    WHEN p.title LIKE '%Pedicure%' THEN 20000 -- $20.000
    ELSE 10000
  END,
  CASE 
    WHEN p.category = 'Servicios' THEN 10 -- Servicios tienen disponibilidad diaria
    ELSE 20 -- Productos físicos tienen stock
  END,
  true
FROM products p
WHERE p.category IN ('Comida Rápida', 'Bebidas', 'Servicios')
  AND p.title IN (
    'Pizza Margherita', 'Pizza Pepperoni', 'Pizza Hawaiana', 'Pizza Cuatro Quesos',
    'Perro Caliente Clásico', 'Perro Caliente Especial', 'Perro Caliente Vegetariano',
    'Hamburguesa Clásica', 'Hamburguesa BBQ', 'Hamburguesa Vegetariana',
    'Coca Cola 500ml', 'Pepsi 500ml', 'Agua Natural 500ml',
    'Corte de Cabello Masculino', 'Corte de Cabello Femenino', 'Manicure Básica', 'Pedicure Completa'
  );

-- Para el segundo vendedor (Usuario)
INSERT INTO seller_products (product_id, seller_id, price_cents, stock, active)
SELECT 
  p.id,
  'df33248a-5462-452b-a4f1-5d17c8c05a51'::uuid, -- ID del Usuario
  CASE 
    WHEN p.title LIKE '%Pizza%' THEN 16000 -- $16.000
    WHEN p.title LIKE '%Perro%' THEN 8500  -- $8.500
    WHEN p.title LIKE '%Hamburguesa%' THEN 13000 -- $13.000
    WHEN p.title LIKE '%Coca%' OR p.title LIKE '%Pepsi%' THEN 3200 -- $3.200
    WHEN p.title LIKE '%Agua%' THEN 2200 -- $2.200
    WHEN p.title LIKE '%Corte%' THEN 30000 -- $30.000
    WHEN p.title LIKE '%Manicure%' THEN 18000 -- $18.000
    WHEN p.title LIKE '%Pedicure%' THEN 25000 -- $25.000
    ELSE 11000
  END,
  CASE 
    WHEN p.category = 'Servicios' THEN 8 -- Servicios tienen disponibilidad diaria
    ELSE 15 -- Productos físicos tienen stock
  END,
  true
FROM products p
WHERE p.category IN ('Comida Rápida', 'Bebidas', 'Servicios')
  AND p.title IN (
    'Pizza Margherita', 'Pizza Pepperoni', 'Pizza Hawaiana', 'Pizza Cuatro Quesos',
    'Perro Caliente Clásico', 'Perro Caliente Especial', 'Perro Caliente Vegetariano',
    'Hamburguesa Clásica', 'Hamburguesa BBQ', 'Hamburguesa Vegetariana',
    'Coca Cola 500ml', 'Pepsi 500ml', 'Agua Natural 500ml',
    'Corte de Cabello Masculino', 'Corte de Cabello Femenino', 'Manicure Básica', 'Pedicure Completa'
  );

-- 4. Verificar que se agregaron correctamente
SELECT 
  p.title,
  p.category,
  sp.price_cents,
  sp.stock,
  sp.active,
  pr.name as seller_name
FROM products p
JOIN seller_products sp ON p.id = sp.product_id
JOIN profiles pr ON sp.seller_id = pr.id
WHERE p.category IN ('Comida Rápida', 'Bebidas', 'Servicios')
ORDER BY p.category, p.title;




