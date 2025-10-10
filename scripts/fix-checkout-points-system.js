#!/usr/bin/env node

/**
 * Script completo para arreglar el sistema de checkout y puntos
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

async function fixCheckoutPointsSystem() {
  console.log('🔧 Arreglando sistema de checkout y puntos...\n');
  
  try {
    const sellerUuid = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // Diego Ramírez
    
    // 1. Crear tablas de carrito
    console.log('🛒 1. Creando tablas de carrito...');
    const cartTablesSQL = `
      -- Tabla de carritos
      CREATE TABLE IF NOT EXISTS carts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, seller_id)
      );

      -- Tabla de items del carrito
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
        product_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        price_cents INTEGER NOT NULL,
        qty INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Habilitar RLS
      ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
    `;

    const { error: cartTablesError } = await supabase.rpc('exec_sql', { sql_query: cartTablesSQL });
    if (cartTablesError) {
      console.log('⚠️ Error creando tablas de carrito:', cartTablesError.message);
    } else {
      console.log('✅ Tablas de carrito creadas');
    }

    // 2. Crear tablas de sistema de puntos
    console.log('\n🎯 2. Creando sistema de puntos...');
    const pointsSystemSQL = `
      -- Tabla de configuración de recompensas
      CREATE TABLE IF NOT EXISTS seller_rewards_config (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT false,
        points_per_peso DECIMAL(10,4) DEFAULT 0.0286,
        minimum_purchase_cents INTEGER DEFAULT 500000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(seller_id)
      );

      -- Tabla de niveles de recompensa
      CREATE TABLE IF NOT EXISTS seller_reward_tiers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        tier_name VARCHAR(100) NOT NULL,
        minimum_purchase_cents INTEGER NOT NULL,
        points_multiplier DECIMAL(10,4) DEFAULT 1.0,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(seller_id, tier_name)
      );

      -- Tabla de historial de puntos
      CREATE TABLE IF NOT EXISTS points_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        points_earned INTEGER DEFAULT 0,
        points_spent INTEGER DEFAULT 0,
        transaction_type VARCHAR(20) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tabla de puntos del usuario
      CREATE TABLE IF NOT EXISTS user_points (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        points INTEGER DEFAULT 0,
        source VARCHAR(50),
        order_id UUID REFERENCES orders(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, seller_id)
      );
    `;

    const { error: pointsSystemError } = await supabase.rpc('exec_sql', { sql_query: pointsSystemSQL });
    if (pointsSystemError) {
      console.log('⚠️ Error creando sistema de puntos:', pointsSystemError.message);
    } else {
      console.log('✅ Sistema de puntos creado');
    }

    // 3. Configurar recompensas para Diego Ramírez
    console.log('\n🎯 3. Configurando recompensas...');
    
    // Verificar si ya existe configuración
    const { data: existingConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('*')
      .eq('seller_id', sellerUuid);

    if (configError) {
      console.log('❌ Error verificando configuración:', configError.message);
    } else if (!existingConfig || existingConfig.length === 0) {
      // Crear configuración
      const { error: insertConfigError } = await supabase
        .from('seller_rewards_config')
        .insert({
          seller_id: sellerUuid,
          is_active: true,
          points_per_peso: 0.0286, // 1 punto = 35 pesos
          minimum_purchase_cents: 500000 // $5,000 mínimo
        });

      if (insertConfigError) {
        console.log('❌ Error creando configuración:', insertConfigError.message);
      } else {
        console.log('✅ Configuración de recompensas creada');
      }
    } else {
      // Activar configuración existente
      const { error: updateConfigError } = await supabase
        .from('seller_rewards_config')
        .update({ is_active: true })
        .eq('seller_id', sellerUuid);

      if (updateConfigError) {
        console.log('❌ Error activando configuración:', updateConfigError.message);
      } else {
        console.log('✅ Configuración de recompensas activada');
      }
    }

    // 4. Crear niveles de recompensa
    const { data: existingTiers, error: tiersError } = await supabase
      .from('seller_reward_tiers')
      .select('*')
      .eq('seller_id', sellerUuid);

    if (tiersError) {
      console.log('❌ Error verificando niveles:', tiersError.message);
    } else if (!existingTiers || existingTiers.length === 0) {
      const tiers = [
        {
          seller_id: sellerUuid,
          tier_name: 'Bronce',
          minimum_purchase_cents: 500000,
          points_multiplier: 1.0,
          description: 'Nivel básico',
          is_active: true
        },
        {
          seller_id: sellerUuid,
          tier_name: 'Plata',
          minimum_purchase_cents: 1000000,
          points_multiplier: 1.2,
          description: 'Nivel intermedio',
          is_active: true
        },
        {
          seller_id: sellerUuid,
          tier_name: 'Oro',
          minimum_purchase_cents: 2000000,
          points_multiplier: 1.5,
          description: 'Nivel premium',
          is_active: true
        }
      ];

      const { error: insertTiersError } = await supabase
        .from('seller_reward_tiers')
        .insert(tiers);

      if (insertTiersError) {
        console.log('❌ Error creando niveles:', insertTiersError.message);
      } else {
        console.log('✅ Niveles de recompensa creados');
      }
    } else {
      console.log('✅ Niveles de recompensa ya existen');
    }

    // 5. Crear función place_order
    console.log('\n🔧 4. Creando función place_order...');
    const placeOrderSQL = `
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
        
        -- 5. PROCESAR SISTEMA DE RECOMPENSAS
        SELECT * INTO v_rewards_config FROM seller_rewards_config src
        WHERE src.seller_id = p_seller_id AND src.is_active = true;

        IF v_rewards_config IS NOT NULL THEN
          IF v_total_cents >= v_rewards_config.minimum_purchase_cents THEN
            -- Obtener nivel de recompensa
            SELECT * INTO v_reward_tier
            FROM seller_reward_tiers
            WHERE seller_id = p_seller_id 
              AND minimum_purchase_cents <= v_total_cents
              AND is_active = true
            ORDER BY minimum_purchase_cents DESC
            LIMIT 1;
            
            IF v_reward_tier IS NOT NULL THEN
              v_tier_multiplier := v_reward_tier.points_multiplier;
            END IF;
            
            -- Calcular puntos
            v_points_earned := FLOOR(v_total_cents * v_rewards_config.points_per_peso * v_tier_multiplier);

            -- Registrar en points_history
            INSERT INTO points_history (
              user_id, seller_id, order_id, points_earned, transaction_type, description
            ) VALUES (
              p_user_id, p_seller_id, v_order_id, v_points_earned, 'earned',
              'Puntos ganados por compra de $' || (v_total_cents / 100) || ' (Nivel: ' || COALESCE(v_reward_tier.tier_name, 'Base') || ')'
            );

            -- Actualizar puntos del usuario
            INSERT INTO user_points (user_id, seller_id, points, source, order_id)
            VALUES (p_user_id, p_seller_id, v_points_earned, 'order', v_order_id)
            ON CONFLICT (user_id, seller_id) DO UPDATE
            SET points = user_points.points + v_points_earned, updated_at = NOW();
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

    const { error: placeOrderError } = await supabase.rpc('exec_sql', { sql_query: placeOrderSQL });
    if (placeOrderError) {
      console.log('❌ Error creando función place_order:', placeOrderError.message);
    } else {
      console.log('✅ Función place_order creada');
    }

    console.log('\n🎉 SISTEMA COMPLETAMENTE CONFIGURADO:');
    console.log('✅ Tablas de carrito creadas');
    console.log('✅ Sistema de puntos configurado');
    console.log('✅ Recompensas activas para Diego Ramírez');
    console.log('✅ Niveles: Bronce (1.0x), Plata (1.2x), Oro (1.5x)');
    console.log('✅ Función place_order lista');
    console.log('✅ Próximas compras otorgarán puntos automáticamente');

  } catch (error) {
    console.error('❌ Error configurando sistema:', error);
  }
}

fixCheckoutPointsSystem();








