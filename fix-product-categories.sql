-- Script para corregir las categorías de productos
-- Ejecutar en el SQL Editor de Supabase

-- 1. Ver las categorías actuales
SELECT id, title, category FROM products ORDER BY category, title;

-- 2. Actualizar cervezas a bebidas_alcoholicas
UPDATE products 
SET category = 'bebidas_alcoholicas' 
WHERE title ILIKE '%cerveza%' 
   OR title ILIKE '%corona%' 
   OR title ILIKE '%babaria%'
   OR title ILIKE '%sol%sixpack%';

-- 3. Actualizar whisky a bebidas_alcoholicas
UPDATE products 
SET category = 'bebidas_alcoholicas' 
WHERE title ILIKE '%whisky%' 
   OR title ILIKE '%buchanan%';

-- 4. Actualizar cigarrillos a bebidas_alcoholicas
UPDATE products 
SET category = 'bebidas_alcoholicas' 
WHERE title ILIKE '%cigarrillo%' 
   OR title ILIKE '%gift eight%'
   OR title ILIKE '%tabaco%';

-- 5. Verificar los cambios
SELECT id, title, category FROM products WHERE category = 'bebidas_alcoholicas' ORDER BY title;

-- 6. Ver todas las categorías
SELECT category, COUNT(*) as total FROM products GROUP BY category ORDER BY total DESC;




