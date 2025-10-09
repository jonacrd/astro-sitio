-- Script para mejorar el checkout con expiración de pedidos y sistema de transferencias
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar campos de expiración y estado de pago a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'pending_review', 'confirmed', 'rejected'));

-- 2. Crear tabla de pagos para manejar comprobantes de transferencia
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'points')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_review', 'confirmed', 'rejected')),
  transfer_receipt_url TEXT, -- URL del comprobante en Storage
  transfer_details JSONB, -- Detalles de la transferencia (banco, número de cuenta, etc.)
  reviewed_by UUID REFERENCES auth.users(id), -- Usuario que revisó el pago
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 4. Habilitar RLS en la nueva tabla
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payments for their orders" ON payments
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update payments for their orders" ON payments
  FOR UPDATE USING (
    order_id IN (
      SELECT id FROM orders WHERE seller_id = auth.uid()
    )
  );

-- 6. Función para crear pedido con expiración
CREATE OR REPLACE FUNCTION place_order_with_expiration(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method VARCHAR(20),
  p_expiration_minutes INTEGER DEFAULT 15
) RETURNS JSON AS $$
DECLARE
  v_cart_id UUID;
  v_total_cents INTEGER := 0;
  v_order_id UUID;
  v_payment_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular tiempo de expiración
  v_expires_at := NOW() + (p_expiration_minutes || ' minutes')::INTERVAL;
  
  -- 1. Obtener carrito del usuario
  SELECT c.id INTO v_cart_id
  FROM carts c
  WHERE c.user_id = p_user_id AND c.seller_id = p_seller_id;
  
  IF v_cart_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No hay carrito para este vendedor'
    );
  END IF;
  
  -- 2. Calcular total
  SELECT COALESCE(SUM(ci.price_cents * ci.qty), 0) INTO v_total_cents
  FROM cart_items ci
  WHERE ci.cart_id = v_cart_id;
  
  IF v_total_cents = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El carrito está vacío'
    );
  END IF;
  
  -- 3. Crear pedido con expiración
  INSERT INTO orders (
    user_id, 
    seller_id, 
    total_cents, 
    payment_method, 
    status, 
    expires_at,
    payment_status,
    delivery_address, 
    delivery_notes
  )
  VALUES (
    p_user_id, 
    p_seller_id, 
    v_total_cents, 
    p_payment_method, 
    'placed', 
    v_expires_at,
    CASE WHEN p_payment_method = 'transfer' THEN 'pending' ELSE 'confirmed' END,
    '{}', 
    ''
  )
  RETURNING id INTO v_order_id;
  
  -- 4. Crear registro de pago
  INSERT INTO payments (
    order_id,
    amount_cents,
    payment_method,
    status
  )
  VALUES (
    v_order_id,
    v_total_cents,
    p_payment_method,
    CASE WHEN p_payment_method = 'transfer' THEN 'pending' ELSE 'confirmed' END
  )
  RETURNING id INTO v_payment_id;
  
  -- 5. Crear items del pedido
  INSERT INTO order_items (order_id, product_id, title, price_cents, qty)
  SELECT v_order_id, ci.product_id, ci.title, ci.price_cents, ci.qty
  FROM cart_items ci
  WHERE ci.cart_id = v_cart_id;
  
  -- 6. Limpiar carrito
  DELETE FROM cart_items WHERE cart_id = v_cart_id;
  DELETE FROM carts WHERE id = v_cart_id;
  
  -- 7. Crear notificación para el comprador
  INSERT INTO notifications (user_id, type, title, message, order_id)
  VALUES (
    p_user_id,
    'order_placed',
    'Pedido realizado',
    'Tu pedido #' || v_order_id || ' ha sido realizado. ' || 
    CASE WHEN p_payment_method = 'transfer' 
      THEN 'Sube tu comprobante de transferencia para confirmar el pago.'
      ELSE 'El pago ha sido confirmado.'
    END,
    v_order_id
  );
  
  -- 8. Crear notificación para el vendedor
  INSERT INTO notifications (user_id, type, title, message, order_id)
  VALUES (
    p_seller_id,
    'new_order',
    'Nuevo pedido recibido',
    'Has recibido un nuevo pedido #' || v_order_id || ' por $' || (v_total_cents / 100.0)::TEXT,
    v_order_id
  );
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'payment_id', v_payment_id,
    'total_cents', v_total_cents,
    'expires_at', v_expires_at,
    'payment_status', CASE WHEN p_payment_method = 'transfer' THEN 'pending' ELSE 'confirmed' END
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Función para cancelar pedidos expirados
CREATE OR REPLACE FUNCTION cancel_expired_orders() RETURNS INTEGER AS $$
DECLARE
  v_cancelled_count INTEGER := 0;
  order_record RECORD;
BEGIN
  -- Buscar pedidos expirados que aún están en estado 'placed'
  FOR order_record IN 
    SELECT id, user_id, seller_id, total_cents
    FROM orders 
    WHERE status = 'placed' 
      AND expires_at < NOW()
      AND payment_status = 'pending'
  LOOP
    -- Actualizar estado del pedido
    UPDATE orders 
    SET 
      status = 'cancelled',
      payment_status = 'rejected',
      updated_at = NOW()
    WHERE id = order_record.id;
    
    -- Actualizar estado del pago
    UPDATE payments 
    SET 
      status = 'rejected',
      rejection_reason = 'Pedido expirado - sin pago confirmado',
      updated_at = NOW()
    WHERE order_id = order_record.id;
    
    -- Crear notificación para el comprador
    INSERT INTO notifications (user_id, type, title, message, order_id)
    VALUES (
      order_record.user_id,
      'order_cancelled',
      'Pedido cancelado',
      'Tu pedido #' || order_record.id || ' ha sido cancelado por falta de pago.',
      order_record.id
    );
    
    -- Crear notificación para el vendedor
    INSERT INTO notifications (user_id, type, title, message, order_id)
    VALUES (
      order_record.seller_id,
      'order_cancelled',
      'Pedido cancelado',
      'El pedido #' || order_record.id || ' ha sido cancelado por falta de pago.',
      order_record.id
    );
    
    v_cancelled_count := v_cancelled_count + 1;
  END LOOP;
  
  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para validar comprobante de transferencia
CREATE OR REPLACE FUNCTION validate_transfer_receipt(
  p_payment_id UUID,
  p_reviewer_id UUID,
  p_approved BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_payment_record RECORD;
  v_order_record RECORD;
BEGIN
  -- Obtener información del pago
  SELECT p.*, o.user_id, o.seller_id, o.status as order_status
  INTO v_payment_record
  FROM payments p
  JOIN orders o ON o.id = p.order_id
  WHERE p.id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pago no encontrado');
  END IF;
  
  IF v_payment_record.status != 'pending_review' THEN
    RETURN json_build_object('success', false, 'error', 'El pago no está pendiente de revisión');
  END IF;
  
  IF p_approved THEN
    -- Aprobar pago
    UPDATE payments 
    SET 
      status = 'confirmed',
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_payment_id;
    
    -- Actualizar estado del pedido
    UPDATE orders 
    SET 
      payment_status = 'confirmed',
      status = 'seller_confirmed',
      updated_at = NOW()
    WHERE id = v_payment_record.order_id;
    
    -- Crear notificación para el comprador
    INSERT INTO notifications (user_id, type, title, message, order_id)
    VALUES (
      v_payment_record.user_id,
      'payment_confirmed',
      'Pago confirmado',
      'Tu pago para el pedido #' || v_payment_record.order_id || ' ha sido confirmado.',
      v_payment_record.order_id
    );
    
    -- Crear notificación para el vendedor
    INSERT INTO notifications (user_id, type, title, message, order_id)
    VALUES (
      v_payment_record.seller_id,
      'payment_confirmed',
      'Pago confirmado',
      'El pago del pedido #' || v_payment_record.order_id || ' ha sido confirmado.',
      v_payment_record.order_id
    );
    
  ELSE
    -- Rechazar pago
    UPDATE payments 
    SET 
      status = 'rejected',
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
    WHERE id = p_payment_id;
    
    -- Actualizar estado del pedido
    UPDATE orders 
    SET 
      payment_status = 'rejected',
      status = 'cancelled',
      updated_at = NOW()
    WHERE id = v_payment_record.order_id;
    
    -- Crear notificación para el comprador
    INSERT INTO notifications (user_id, type, title, message, order_id)
    VALUES (
      v_payment_record.user_id,
      'payment_rejected',
      'Pago rechazado',
      'Tu pago para el pedido #' || v_payment_record.order_id || ' ha sido rechazado. ' || COALESCE(p_rejection_reason, ''),
      v_payment_record.order_id
    );
  END IF;
  
  RETURN json_build_object('success', true, 'payment_id', p_payment_id);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 9. Crear vista para dashboard de pagos pendientes
CREATE OR REPLACE VIEW pending_payments_view AS
SELECT 
  p.id as payment_id,
  p.order_id,
  p.amount_cents,
  p.payment_method,
  p.transfer_receipt_url,
  p.transfer_details,
  p.created_at as payment_created_at,
  o.user_id as buyer_id,
  o.seller_id,
  o.total_cents,
  o.status as order_status,
  o.expires_at,
  pu.email as buyer_email,
  su.email as seller_email
FROM payments p
JOIN orders o ON o.id = p.order_id
JOIN auth.users pu ON pu.id = o.user_id
JOIN auth.users su ON su.id = o.seller_id
WHERE p.status = 'pending_review'
ORDER BY p.created_at ASC;

-- 10. Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();






