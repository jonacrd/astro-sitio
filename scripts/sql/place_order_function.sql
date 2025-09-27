-- Función RPC para procesar órdenes
CREATE OR REPLACE FUNCTION place_order(
  user_id UUID,
  seller_id UUID,
  payment_method TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_id UUID;
  total_cents INTEGER;
  points_added INTEGER;
  cart_record RECORD;
  cart_item_record RECORD;
  seller_product_record RECORD;
BEGIN
  -- Verificar que el usuario tiene un carrito para este vendedor
  SELECT id INTO cart_record
  FROM carts
  WHERE carts.user_id = place_order.user_id
    AND carts.seller_id = place_order.seller_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', 'No hay carrito para este vendedor'
    );
  END IF;

  -- Verificar que el carrito tiene items
  IF NOT EXISTS (
    SELECT 1 FROM cart_items 
    WHERE cart_id = cart_record.id
  ) THEN
    RETURN json_build_object(
      'error', 'El carrito está vacío'
    );
  END IF;

  -- Calcular total y verificar stock
  total_cents := 0;
  
  FOR cart_item_record IN 
    SELECT ci.*, sp.stock, sp.price_cents as seller_price_cents
    FROM cart_items ci
    LEFT JOIN seller_products sp ON sp.product_id = ci.product_id AND sp.seller_id = place_order.seller_id
    WHERE ci.cart_id = cart_record.id
  LOOP
    -- Verificar stock disponible
    IF cart_item_record.stock IS NULL OR cart_item_record.stock < cart_item_record.qty THEN
      RETURN json_build_object(
        'error', 'Stock insuficiente para el producto: ' || cart_item_record.title
      );
    END IF;
    
    -- Usar precio del vendedor si está disponible, sino el del carrito
    IF cart_item_record.seller_price_cents IS NOT NULL THEN
      total_cents := total_cents + (cart_item_record.seller_price_cents * cart_item_record.qty);
    ELSE
      total_cents := total_cents + (cart_item_record.price_cents * cart_item_record.qty);
    END IF;
  END LOOP;

  -- Crear la orden
  INSERT INTO orders (
    user_id,
    seller_id,
    total_cents,
    payment_method,
    status
  ) VALUES (
    place_order.user_id,
    place_order.seller_id,
    total_cents,
    place_order.payment_method,
    'pending'
  ) RETURNING id INTO order_id;

  -- Crear items de la orden y actualizar stock
  FOR cart_item_record IN 
    SELECT ci.*, sp.stock, sp.price_cents as seller_price_cents
    FROM cart_items ci
    LEFT JOIN seller_products sp ON sp.product_id = ci.product_id AND sp.seller_id = place_order.seller_id
    WHERE ci.cart_id = cart_record.id
  LOOP
    -- Insertar item de la orden
    INSERT INTO order_items (
      order_id,
      product_id,
      title,
      price_cents,
      qty
    ) VALUES (
      order_id,
      cart_item_record.product_id,
      cart_item_record.title,
      COALESCE(cart_item_record.seller_price_cents, cart_item_record.price_cents),
      cart_item_record.qty
    );

    -- Actualizar stock del vendedor
    UPDATE seller_products 
    SET stock = stock - cart_item_record.qty
    WHERE product_id = cart_item_record.product_id 
      AND seller_id = place_order.seller_id;
  END LOOP;

  -- Limpiar el carrito
  DELETE FROM cart_items WHERE cart_id = cart_record.id;
  DELETE FROM carts WHERE id = cart_record.id;

  -- Calcular puntos (1 punto por cada $100)
  points_added := total_cents / 10000; -- 10000 centavos = $100

  -- Actualizar puntos del usuario (si existe tabla de puntos)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_points') THEN
    INSERT INTO user_points (user_id, points, source, order_id)
    VALUES (place_order.user_id, points_added, 'order', order_id)
    ON CONFLICT (user_id) DO UPDATE SET 
      points = user_points.points + points_added,
      updated_at = NOW();
  END IF;

  -- Retornar resultado
  RETURN json_build_object(
    'orderId', order_id,
    'totalCents', total_cents,
    'pointsAdded', points_added
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, hacer rollback
    ROLLBACK;
    RETURN json_build_object(
      'error', 'Error procesando la orden: ' || SQLERRM
    );
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION place_order(UUID, UUID, TEXT) TO authenticated;




