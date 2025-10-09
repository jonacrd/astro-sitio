-- Script para actualizar el teléfono del comprador
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los perfiles actuales
SELECT id, name, phone FROM profiles;

-- 2. Actualizar TODOS los perfiles con el número de WhatsApp
UPDATE profiles 
SET phone = '+56962614851';

-- 3. Verificar que se actualizó
SELECT id, name, phone FROM profiles WHERE phone = '+56962614851';

-- 4. Ver estructura de la tabla orders para saber qué user_id usar
SELECT id, user_id, seller_id, status FROM orders ORDER BY created_at DESC LIMIT 5;

