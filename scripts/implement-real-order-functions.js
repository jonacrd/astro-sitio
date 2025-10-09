import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function implementRealOrderFunctions() {
  try {
    console.log('🔧 Implementando funciones reales del sistema de pedidos...');
    
    // 1. Crear función para confirmar entrega por vendedor
    console.log('\n📝 Creando función confirm_delivery_by_seller...');
    
    const confirmDeliverySQL = `
      CREATE OR REPLACE FUNCTION confirm_delivery_by_seller(
        p_order_id UUID,
        p_seller_id UUID
      ) RETURNS JSON AS $$
      DECLARE
        v_order RECORD;
        v_buyer_id UUID;
        v_points INTEGER := 0;
        v_rewards_config RECORD;
      BEGIN
        -- Verificar que el pedido existe y pertenece al vendedor
        SELECT * INTO v_order FROM orders WHERE id = p_order_id AND seller_id = p_seller_id;
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'error', 'Pedido no encontrado');
        END IF;
        
        IF v_order.status != 'confirmed' THEN
          RETURN json_build_object('success', false, 'error', 'El pedido debe estar confirmado primero');
        END IF;
        
        -- Actualizar estado del pedido
        UPDATE orders 
        SET status = 'delivered',
            updated_at = NOW()
        WHERE id = p_order_id;
        
        -- Obtener buyer_id
        v_buyer_id := v_order.user_id;
        
        -- Verificar si el vendedor tiene sistema de recompensas activo
        SELECT * INTO v_rewards_config FROM seller_rewards_config
        WHERE seller_id = p_seller_id AND is_active = true;
        
        -- Si hay sistema de recompensas y la compra supera el mínimo
        IF v_rewards_config IS NOT NULL AND v_order.total_cents >= v_rewards_config.minimum_purchase_cents THEN
          -- Calcular puntos
          v_points := FLOOR(v_order.total_cents * v_rewards_config.points_per_peso);
          
          -- Agregar puntos al usuario
          INSERT INTO user_points (user_id, seller_id, points, source, order_id)
          VALUES (v_buyer_id, p_seller_id, v_points, 'delivery', p_order_id)
          ON CONFLICT (user_id, seller_id)
          DO UPDATE SET 
            points = user_points.points + v_points,
            updated_at = NOW();
          
          -- Crear historial de puntos
          INSERT INTO points_history (user_id, seller_id, order_id, points_earned, transaction_type, description)
          VALUES (v_buyer_id, p_seller_id, p_order_id, v_points, 'earned', 
                  'Puntos por entrega confirmada - Compra de $' || (v_order.total_cents / 100));
        END IF;
        
        -- Crear notificación para el comprador
        INSERT INTO notifications (user_id, type, title, message, order_id, is_read)
        VALUES (v_buyer_id, 'order_delivered', '¡Pedido Entregado!', 
                'Tu pedido ha sido entregado. ' || 
                CASE WHEN v_points > 0 THEN 'Has ganado ' || v_points || ' puntos.' ELSE '' END,
                p_order_id, false);
        
        -- Crear notificación de puntos si se ganaron
        IF v_points > 0 THEN
          INSERT INTO notifications (user_id, type, title, message, order_id, is_read)
          VALUES (v_buyer_id, 'points_earned', '¡Puntos Ganados!', 
                  'Has ganado ' || v_points || ' puntos por tu compra de $' || (v_order.total_cents / 100),
                  p_order_id, false);
        END IF;
        
        RETURN json_build_object(
          'success', true, 
          'message', 'Entrega confirmada exitosamente', 
          'points', v_points,
          'total', v_order.total_cents / 100
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: deliveryError } = await supabase.rpc('exec_sql', { 
      sql: confirmDeliverySQL 
    });
    
    if (deliveryError) {
      console.log('⚠️ Error creando confirm_delivery_by_seller, intentando método directo...');
      
      // Intentar ejecutar directamente
      const { error: directError } = await supabase
        .from('exec_sql')
        .insert({ sql: confirmDeliverySQL });
      
      if (directError) {
        console.log('❌ No se pudo crear la función automáticamente');
        console.log('📋 SQL para ejecutar en Supabase Dashboard:');
        console.log(confirmDeliverySQL);
      }
    } else {
      console.log('✅ Función confirm_delivery_by_seller creada');
    }
    
    // 2. Crear función para confirmar recepción por comprador
    console.log('\n📝 Creando función confirm_receipt_by_buyer...');
    
    const confirmReceiptSQL = `
      CREATE OR REPLACE FUNCTION confirm_receipt_by_buyer(
        p_order_id UUID,
        p_buyer_id UUID
      ) RETURNS JSON AS $$
      DECLARE
        v_order RECORD;
      BEGIN
        -- Verificar que el pedido existe y pertenece al comprador
        SELECT * INTO v_order FROM orders WHERE id = p_order_id AND user_id = p_buyer_id;
        
        IF NOT FOUND THEN
          RETURN json_build_object('success', false, 'error', 'Pedido no encontrado');
        END IF;
        
        IF v_order.status != 'delivered' THEN
          RETURN json_build_object('success', false, 'error', 'El pedido debe estar entregado primero');
        END IF;
        
        -- Actualizar estado del pedido
        UPDATE orders 
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = p_order_id;
        
        -- Crear notificación para el vendedor
        INSERT INTO notifications (user_id, type, title, message, order_id, is_read)
        VALUES (v_order.seller_id, 'order_completed', 'Pedido Completado', 
                'El comprador ha confirmado la recepción del pedido #' || SUBSTRING(p_order_id::text, 1, 8),
                p_order_id, false);
        
        RETURN json_build_object('success', true, 'message', 'Recepción confirmada exitosamente');
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    console.log('📋 SQL para ejecutar manualmente en Supabase:');
    console.log('\n--- EJECUTAR ESTE SQL EN SUPABASE DASHBOARD ---');
    console.log(confirmDeliverySQL);
    console.log('\n');
    console.log(confirmReceiptSQL);
    console.log('--- FIN DEL SQL ---\n');
    
    console.log('🔧 Una vez ejecutado el SQL, creando pedido real con carrito...');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

implementRealOrderFunctions();









