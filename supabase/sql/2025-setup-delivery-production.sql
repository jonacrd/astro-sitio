-- Configuración completa para sistema de delivery en producción
-- Ejecutar en Supabase SQL Editor

-- 1. Deshabilitar RLS temporalmente para testing
ALTER TABLE public.couriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notifications DISABLE ROW LEVEL SECURITY;

-- 2. Limpiar datos existentes (opcional)
DELETE FROM public.delivery_notifications;
DELETE FROM public.delivery_offers;
DELETE FROM public.deliveries;
DELETE FROM public.couriers;

-- 3. Crear repartidores de prueba
INSERT INTO public.couriers (id, user_id, name, phone, is_active, is_available) VALUES
(gen_random_uuid(), 'repartidor1@test.com', 'Repartidor 1', '+56962614851', true, true),
(gen_random_uuid(), 'repartidor2@test.com', 'Repartidor 2', '+56962614851', true, true),
(gen_random_uuid(), 'repartidor3@test.com', 'Repartidor 3', '+56962614851', true, true);

-- 4. Crear vendedores de prueba
INSERT INTO public.profiles (id, name, phone, is_seller, opt_in_whatsapp) VALUES
(gen_random_uuid(), 'Vendedor 1', '+56962614851', true, true),
(gen_random_uuid(), 'Vendedor 2', '+56962614851', true, true),
(gen_random_uuid(), 'Vendedor 3', '+56962614851', true, true)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  opt_in_whatsapp = EXCLUDED.opt_in_whatsapp;

-- 5. Crear compradores de prueba
INSERT INTO public.profiles (id, name, phone, is_seller, opt_in_whatsapp) VALUES
(gen_random_uuid(), 'Comprador 1', '+56962614851', false, true),
(gen_random_uuid(), 'Comprador 2', '+56962614851', false, true),
(gen_random_uuid(), 'Comprador 3', '+56962614851', false, true)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  opt_in_whatsapp = EXCLUDED.opt_in_whatsapp;

-- 6. Crear 3 deliveries de prueba
WITH 
  courier_ids AS (SELECT id FROM public.couriers LIMIT 3),
  seller_ids AS (SELECT id FROM public.profiles WHERE is_seller = true LIMIT 3),
  buyer_ids AS (SELECT id FROM public.profiles WHERE is_seller = false LIMIT 3)
INSERT INTO public.deliveries (id, order_id, seller_id, courier_id, status, pickup_address, dropoff_address)
SELECT 
  gen_random_uuid(),
  'ORDER_' || generate_series(1, 3),
  (SELECT id FROM seller_ids LIMIT 1 OFFSET (generate_series(1, 3) - 1)),
  (SELECT id FROM courier_ids LIMIT 1 OFFSET (generate_series(1, 3) - 1)),
  'pending',
  'Calle Test ' || generate_series(1, 3) || ', Santiago',
  'Av. Mock ' || generate_series(1, 3) || ', Santiago'
FROM generate_series(1, 3);

-- 7. Verificar datos creados
SELECT 'couriers' as table_name, count(*) as count FROM public.couriers
UNION ALL
SELECT 'deliveries' as table_name, count(*) as count FROM public.deliveries
UNION ALL
SELECT 'profiles (sellers)' as table_name, count(*) as count FROM public.profiles WHERE is_seller = true
UNION ALL
SELECT 'profiles (buyers)' as table_name, count(*) as count FROM public.profiles WHERE is_seller = false;

-- 8. Mostrar datos de prueba
SELECT 'COURIERS' as info, id, name, phone, is_active, is_available FROM public.couriers;
SELECT 'DELIVERIES' as info, id, order_id, seller_id, courier_id, status FROM public.deliveries;
SELECT 'PROFILES' as info, id, name, phone, is_seller, opt_in_whatsapp FROM public.profiles WHERE phone = '+56962614851';
