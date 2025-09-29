-- Script para agregar columnas faltantes a la tabla orders
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna payment_status si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- 2. Agregar columna expires_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'expires_at') THEN
        ALTER TABLE orders ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Agregar columna points_awarded si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'points_awarded') THEN
        ALTER TABLE orders ADD COLUMN points_awarded INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Crear índice para payment_status si no existe
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- 5. Crear índice para expires_at si no existe
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);

-- 6. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('payment_status', 'expires_at', 'points_awarded')
ORDER BY column_name;

