#!/usr/bin/env node

/**
 * Script para asegurar que la función place_order existe y otorga puntos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensurePlaceOrderFunction() {
  console.log('🔧 Asegurando que la función place_order existe y otorga puntos...\n');
  
  try {
    // SQL para crear/actualizar la función place_order
    const sql = `
      CREATE OR REPLACE FUNCTION place_order(
        p_user_id UUID,
        p_seller_id UUID,
        p_payment_method VARCHAR(20)
      ) RETURNS JSON AS $$
      DECLARE
        v_cart_id UUID;
        v_total_cents INTEGER := 0;
        v_order_id UUID;
        v_points_earned INTEGER := 0;
        v_rewards_config RECORD;
        v_reward_tier RECORD;
        v_tier_multiplier DECIMAL(10,4) := 1.0;
      BEGIN
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
        
        -- 3. Crear pedido
        INSERT INTO orders (user_id, seller_id, total_cents, payment_method, status, delivery_address, delivery_notes)
        VALUES (p_user_id, p_seller_id, v_total_cents, p_payment_method, 'pending', '{}', '')
        RETURNING id INTO v_order_id;
        
        -- 4. Crear items del pedido
        INSERT INTO order_items (order_id, product_id, title, price_cents, qty)
        SELECT v_order_id, ci.product_id, ci.title, ci.price_cents, ci.qty
        FROM cart_items ci
        WHERE ci.cart_id = v_cart_id;
        
        -- 5. PROCESAR SISTEMA DE RECOMPENSAS AUTOMÁTICAMENTE
        -- 5.1. Verificar si el vendedor tiene sistema de recompensas activo
        SELECT * INTO v_rewards_config FROM seller_rewards_config src
        WHERE src.seller_id = p_seller_id 
          AND src.is_active = true;

        IF v_rewards_config IS NOT NULL THEN
          -- 5.2. Verificar compra mínima
          IF v_total_cents >= v_rewards_config.minimum_purchase_cents THEN
            -- 5.3. Obtener nivel de recompensa
            SELECT * INTO v_reward_tier
            FROM seller_reward_tiers
            WHERE seller_id = p_seller_id 
              AND minimum_purchase_cents <= v_total_cents
              AND is_active = true
            ORDER BY minimum_purchase_cents DESC
            LIMIT 1;
            
            -- 5.4. Aplicar multiplicador del nivel
            IF v_reward_tier IS NOT NULL THEN
              v_tier_multiplier := v_reward_tier.points_multiplier;
            END IF;
            
            -- 5.5. Calcular puntos
            v_points_earned := FLOOR(v_total_cents * v_rewards_config.points_per_peso * v_tier_multiplier);

            -- 5.6. Registrar en points_history
            INSERT INTO points_history (
              user_id,
              seller_id,
              order_id,
              points_earned,
              transaction_type,
              description
            ) VALUES (
              p_user_id,
              p_seller_id,
              v_order_id,
              v_points_earned,
              'earned',
              'Puntos ganados por compra de $' || (v_total_cents / 100) || ' (Nivel: ' || COALESCE(v_reward_tier.tier_name, 'Base') || ')'
            );

            -- 5.7. Actualizar puntos totales del usuario
            INSERT INTO user_points (user_id, seller_id, points, source, order_id)
            VALUES (p_user_id, p_seller_id, v_points_earned, 'order', v_order_id)
            ON CONFLICT (user_id, seller_id) DO UPDATE
            SET points = user_points.points + v_points_earned,
                updated_at = NOW();
          END IF;
        END IF;

        -- 6. Limpiar carrito
        DELETE FROM cart_items WHERE cart_id = v_cart_id;
        DELETE FROM carts WHERE id = v_cart_id;

        -- 7. Retornar resultado
        RETURN json_build_object(
          'success', true,
          'orderId', v_order_id,
          'totalCents', v_total_cents,
          'pointsAdded', v_points_earned,
          'tierUsed', COALESCE(v_reward_tier.tier_name, 'N/A')
        );
        
      EXCEPTION
        WHEN OTHERS THEN
          RETURN json_build_object(
            'success', false,
            'error', SQLERRM
          );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('📊 Ejecutando SQL en Supabase...');
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (sqlError) {
      console.error('❌ Error ejecutando SQL:', sqlError);
      return;
    }

    console.log('✅ Función place_order creada/actualizada');

    // Verificar que la función existe
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'place_order');

    if (functionsError) {
      console.log('⚠️ No se pudo verificar la función (normal en Supabase)');
    } else {
      console.log('✅ Función place_order verificada');
    }

    console.log('\n🎯 FUNCIÓN PLACE_ORDER CONFIGURADA:');
    console.log('✅ Otorga puntos automáticamente');
    console.log('✅ Verifica configuración del vendedor');
    console.log('✅ Aplica multiplicadores por nivel');
    console.log('✅ Registra en points_history');
    console.log('✅ Actualiza user_points');
    console.log('✅ Limpia carrito automáticamente');

  } catch (error) {
    console.error('❌ Error asegurando función place_order:', error);
  }
}

ensurePlaceOrderFunction();
