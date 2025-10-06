-- Arreglo rápido para sistema de delivery
-- Ejecutar en Supabase SQL Editor

-- 1. Deshabilitar RLS completamente
ALTER TABLE public.couriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notifications DISABLE ROW LEVEL SECURITY;

-- 2. Limpiar datos existentes
DELETE FROM public.delivery_notifications;
DELETE FROM public.delivery_offers;
DELETE FROM public.deliveries;
DELETE FROM public.couriers;

-- 3. Crear usuarios de prueba primero
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, raw_app_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, last_sign_in_at, phone, phone_confirmed_at, phone_change, phone_change_token, confirmed_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'repartidor1@test.com', '$2a$10$dummy', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', '', now(), '+56962614851', now(), '', '', now(), '', 0, null, '', null, false, null, false),
('550e8400-e29b-41d4-a716-446655440012', 'repartidor2@test.com', '$2a$10$dummy', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', '', now(), '+56962614851', now(), '', '', now(), '', 0, null, '', null, false, null, false),
('550e8400-e29b-41d4-a716-446655440013', 'repartidor3@test.com', '$2a$10$dummy', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', '', now(), '+56962614851', now(), '', '', now(), '', 0, null, '', null, false, null, false),
('550e8400-e29b-41d4-a716-446655440021', 'vendedor1@test.com', '$2a$10$dummy', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', '', now(), '+56962614851', now(), '', '', now(), '', 0, null, '', null, false, null, false),
('550e8400-e29b-41d4-a716-446655440022', 'vendedor2@test.com', '$2a$10$dummy', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', '', now(), '+56962614851', now(), '', '', now(), '', 0, null, '', null, false, null, false),
('550e8400-e29b-41d4-a716-446655440023', 'vendedor3@test.com', '$2a$10$dummy', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', '', now(), '+56962614851', now(), '', '', now(), '', 0, null, '', null, false, null, false)
ON CONFLICT (id) DO NOTHING;

-- 4. Crear perfiles para los usuarios
INSERT INTO public.profiles (id, name, phone, is_seller, opt_in_whatsapp) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Repartidor 1', '+56962614851', false, true),
('550e8400-e29b-41d4-a716-446655440012', 'Repartidor 2', '+56962614851', false, true),
('550e8400-e29b-41d4-a716-446655440013', 'Repartidor 3', '+56962614851', false, true),
('550e8400-e29b-41d4-a716-446655440021', 'Vendedor 1', '+56962614851', true, true),
('550e8400-e29b-41d4-a716-446655440022', 'Vendedor 2', '+56962614851', true, true),
('550e8400-e29b-41d4-a716-446655440023', 'Vendedor 3', '+56962614851', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  is_seller = EXCLUDED.is_seller,
  opt_in_whatsapp = EXCLUDED.opt_in_whatsapp;

-- 5. Crear repartidores de prueba
INSERT INTO public.couriers (id, user_id, name, phone, is_active, is_available) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Repartidor 1', '+56962614851', true, true),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'Repartidor 2', '+56962614851', true, true),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440013', 'Repartidor 3', '+56962614851', true, true);

-- 6. Crear deliveries de prueba
INSERT INTO public.deliveries (id, order_id, seller_id, courier_id, status, pickup_address, dropoff_address) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'ORDER_001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'pending', 'Calle Test 1, Santiago', 'Av. Mock 1, Santiago'),
('660e8400-e29b-41d4-a716-446655440002', 'ORDER_002', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'pending', 'Calle Test 2, Santiago', 'Av. Mock 2, Santiago'),
('660e8400-e29b-41d4-a716-446655440003', 'ORDER_003', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'pending', 'Calle Test 3, Santiago', 'Av. Mock 3, Santiago');

-- 7. Verificar datos
SELECT 'COURIERS' as table_name, count(*) as count FROM public.couriers;
SELECT 'DELIVERIES' as table_name, count(*) as count FROM public.deliveries;

-- 8. Mostrar datos creados
SELECT 'REPARTIDORES' as info, id, name, phone, is_active, is_available FROM public.couriers;
SELECT 'DELIVERIES' as info, id, order_id, seller_id, courier_id, status FROM public.deliveries;
