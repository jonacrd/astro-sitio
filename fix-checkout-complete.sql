-- SOLUCIÓN COMPLETA PARA EL CHECKOUT

-- PASO 1: Verificar y agregar columna quantity a order_items
DO $$ 
BEGIN
    -- Verificar si existe la columna qty o quantity
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' AND column_name = 'qty') THEN
        -- Si existe qty, renombrarla a quantity
        ALTER TABLE order_items RENAME COLUMN qty TO quantity;
        RAISE NOTICE 'Columna qty renombrada a quantity';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'order_items' AND column_name = 'quantity') THEN
        -- Si no existe quantity, agregarla
        ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Columna quantity agregada';
    ELSE
        RAISE NOTICE 'Columna quantity ya existe';
    END IF;
END $$;

-- PASO 2: Recrear la función place_order con manejo correcto de items del carrito
DROP FUNCTION IF EXISTS place_order(UUID, UUID, TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_seller_id UUID,
  p_payment_method TEXT,
  p_delivery_address JSONB DEFAULT '{}',
  p_delivery_notes TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_total_cents BIGINT := 0;
  v_delivery_cents BIGINT := 0;
  v_final_total_cents BIGINT;
  v_cart_item RECORD;
  v_points_earned INTEGER := 0;
  v_items_count INTEGER := 0;
BEGIN
  -- Validaciones
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_seller_id AND is_seller = TRUE) THEN
    RAISE EXCEPTION 'Vendedor no encontrado';
  END IF;

  -- Crear la orden
  INSERT INTO orders (
    user_id,
    seller_id,
    total_cents,
    status,
    payment_method,
    delivery_cents,
    delivery_address,
    delivery_notes
  ) VALUES (
    p_user_id,
    p_seller_id,
    0, -- Se actualizará después
    'pending',
    p_payment_method,
    v_delivery_cents,
    p_delivery_address,
    p_delivery_notes
  ) RETURNING id INTO v_order_id;

  RAISE NOTICE 'Orden creada con ID: %', v_order_id;

  -- Procesar items del carrito temporal (tabla carts y cart_items)
  FOR v_cart_item IN
    SELECT 
      ci.product_id,
      ci.price_cents,
      ci.qty as quantity,
      sp.stock,
      sp.seller_id
    FROM cart_items ci
    INNER JOIN carts c ON c.id = ci.cart_id
    INNER JOIN seller_products sp ON sp.product_id = ci.product_id AND sp.seller_id = p_seller_id
    WHERE c.user_id = p_user_id 
      AND c.seller_id = p_seller_id
      AND sp.active = TRUE
  LOOP
    v_items_count := v_items_count + 1;
    RAISE NOTICE 'Procesando item: product_id=%, quantity=%, stock=%', 
      v_cart_item.product_id, v_cart_item.quantity, v_cart_item.stock;

    -- Verificar stock disponible
    IF v_cart_item.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %. Stock disponible: %, cantidad solicitada: %', 
        v_cart_item.product_id, v_cart_item.stock, v_cart_item.quantity;
    END IF;

    -- Insertar item del pedido con la cantidad correcta
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price_cents
    ) VALUES (
      v_order_id,
      v_cart_item.product_id,
      v_cart_item.quantity,
      v_cart_item.price_cents
    );

    RAISE NOTICE 'Item insertado en order_items: product_id=%, quantity=%', 
      v_cart_item.product_id, v_cart_item.quantity;

    -- Descontar stock
    UPDATE seller_products
    SET 
      stock = stock - v_cart_item.quantity,
      updated_at = NOW()
    WHERE seller_id = v_cart_item.seller_id
      AND product_id = v_cart_item.product_id;

    RAISE NOTICE 'Stock actualizado para product_id=%', v_cart_item.product_id;

    -- Acumular total
    v_total_cents := v_total_cents + (v_cart_item.price_cents * v_cart_item.quantity);
    
    -- Calcular puntos (1 punto por cada $100 CLP = 10,000 centavos)
    v_points_earned := v_points_earned + FLOOR((v_cart_item.price_cents * v_cart_item.quantity) / 10000);
  END LOOP;

  -- Validar que hay items
  IF v_items_count = 0 THEN
    RAISE EXCEPTION 'No hay items en el carrito para procesar';
  END IF;

  RAISE NOTICE 'Total de items procesados: %', v_items_count;
  RAISE NOTICE 'Total calculado: % centavos', v_total_cents;

  -- Calcular total final
  v_final_total_cents := v_total_cents + v_delivery_cents;

  -- Actualizar el total de la orden
  UPDATE orders
  SET total_cents = v_final_total_cents
  WHERE id = v_order_id;

  -- Agregar puntos al usuario
  IF v_points_earned > 0 THEN
    INSERT INTO user_points (user_id, points, source, order_id)
    VALUES (p_user_id, v_points_earned, 'purchase', v_order_id);
    
    RAISE NOTICE 'Puntos otorgados: %', v_points_earned;
  END IF;

  -- Limpiar el carrito después de crear la orden
  DELETE FROM cart_items
  WHERE cart_id IN (
    SELECT id FROM carts 
    WHERE user_id = p_user_id AND seller_id = p_seller_id
  );

  RAISE NOTICE 'Carrito limpiado';

  -- Retornar información de la orden como JSON
  RETURN jsonb_build_object(
    'success', TRUE,
    'orderId', v_order_id,
    'totalCents', v_final_total_cents,
    'deliveryCents', v_delivery_cents,
    'pointsAdded', v_points_earned
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en place_order: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Otorgar permisos
GRANT EXECUTE ON FUNCTION place_order(UUID, UUID, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION place_order(UUID, UUID, TEXT, JSONB, TEXT) TO anon;

-- PASO 4: Verificar la estructura
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- PASO 5: Verificar la función
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'place_order';




