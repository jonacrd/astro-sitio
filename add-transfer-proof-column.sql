-- Agregar columna transfer_proof a la tabla orders
-- Esta columna almacenará el comprobante de transferencia como base64

-- Verificar si la columna ya existe antes de crearla
DO $$ 
BEGIN
    -- Agregar la columna transfer_proof si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'transfer_proof'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN transfer_proof TEXT;
        
        RAISE NOTICE 'Columna transfer_proof agregada exitosamente a la tabla orders';
    ELSE
        RAISE NOTICE 'La columna transfer_proof ya existe en la tabla orders';
    END IF;
END $$;

-- Crear comentario para documentar la columna
COMMENT ON COLUMN orders.transfer_proof IS 'Comprobante de transferencia bancaria en formato base64 (para pagos por transferencia)';

