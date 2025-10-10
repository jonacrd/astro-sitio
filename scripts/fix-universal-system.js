import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUniversalSystem() {
  try {
    console.log('🔧 IMPLEMENTANDO SISTEMA UNIVERSAL DE PUNTOS Y RESTRICCIÓN DE TIENDA');
    console.log('=' .repeat(80));
    
    // 1. Crear funciones SQL necesarias
    console.log('\n📝 1. CREANDO FUNCIONES SQL NECESARIAS');
    console.log('-'.repeat(50));
    
    const deliveryFunction = `
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
    
    const receiptFunction = `
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
    
    console.log('📋 SQL PARA EJECUTAR EN SUPABASE DASHBOARD:');
    console.log('=' .repeat(50));
    console.log(deliveryFunction);
    console.log('\n');
    console.log(receiptFunction);
    console.log('=' .repeat(50));
    
    console.log('\n\n🎯 2. RESUMEN DEL SISTEMA UNIVERSAL');
    console.log('-'.repeat(50));
    
    console.log('✅ COMPONENTES YA CONECTADOS AL SISTEMA:');
    console.log('   🛒 /api/cart/add - Maneja carritos por vendedor único');
    console.log('   🎯 place_order() - Asigna puntos automáticamente');
    console.log('   📊 seller_rewards_config - Sistema de recompensas activo');
    console.log('   🔒 cart-store.ts - Validación de vendedor único');
    
    console.log('\n❌ COMPONENTES QUE NECESITAN CORRECCIÓN:');
    
    console.log('\n🔍 SearchBarAI:');
    console.log('   - ❌ No valida vendedor único antes de agregar al carrito');
    console.log('   - ❌ Usa localStorage en lugar de /api/cart/add');
    console.log('   - 🔧 ACCIÓN: Conectar con cart-store y usar API real');
    
    console.log('\n📡 DynamicFeed:');
    console.log('   - ✅ Ya tiene ActiveStoreBanner y lógica de tienda activa');
    console.log('   - ✅ Muestra productos del vendedor activo cuando hay carrito');
    console.log('   - ✅ Sistema funcionando correctamente');
    
    console.log('\n🏪 ProductGrid y componentes similares:');
    console.log('   - ❌ Algunos botones "Añadir" no validan vendedor único');
    console.log('   - 🔧 ACCIÓN: Asegurar que todos usen cart-store.canAddFromSeller()');
    
    console.log('\n\n🔧 3. PLAN DE IMPLEMENTACIÓN');
    console.log('-'.repeat(50));
    
    console.log('PASO 1: Ejecutar SQL en Supabase Dashboard');
    console.log('   - Copia y pega las funciones SQL mostradas arriba');
    console.log('   - Esto habilitará la asignación automática de puntos');
    
    console.log('\nPASO 2: Conectar SearchBarAI con sistema real');
    console.log('   - Reemplazar localStorage con /api/cart/add');
    console.log('   - Agregar validación de vendedor único');
    
    console.log('\nPASO 3: Auditar todos los botones "Añadir al carrito"');
    console.log('   - Verificar que usen /api/cart/add');
    console.log('   - Verificar que validen vendedor único');
    
    console.log('\nPASO 4: Probar flujo completo');
    console.log('   - Agregar productos → Restricción de tienda funciona');
    console.log('   - Checkout → Puntos se asignan automáticamente');
    console.log('   - Confirmar entrega → Puntos adicionales al comprador');
    
    console.log('\n\n🚀 4. RESULTADO ESPERADO');
    console.log('-'.repeat(50));
    
    console.log('✅ SISTEMA UNIVERSAL FUNCIONARÁ:');
    console.log('   🛍️ Desde cualquier componente (feed, búsqueda, categorías)');
    console.log('   🔒 Solo productos de UN vendedor por carrito');
    console.log('   🎯 Puntos automáticos en compras >$5,000');
    console.log('   📊 Sistema de recompensas por vendedor');
    console.log('   🔔 Notificaciones de entregas y puntos');
    
    console.log('\n💎 EXPERIENCIA DEL USUARIO:');
    console.log('   - Agregar producto → Carrito se "bloquea" a esa tienda');
    console.log('   - Ver feed → Solo productos de la tienda activa');
    console.log('   - Buscar → Resultados filtrados por tienda activa');
    console.log('   - Comprar → Puntos asignados automáticamente');
    console.log('   - Confirmar entrega → Puntos adicionales');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixUniversalSystem();










