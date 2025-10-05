#!/usr/bin/env node

/**
 * Script para verificar las tablas de puntos en la base de datos
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

async function checkPointsTables() {
  console.log('🔍 Verificando tablas de puntos en la base de datos...\n');
  
  try {
    // 1. Verificar tabla seller_rewards_config
    console.log('📊 1. Verificando seller_rewards_config...');
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('*')
      .limit(5);

    if (configError) {
      console.log('❌ Error en seller_rewards_config:', configError.message);
    } else {
      console.log('✅ seller_rewards_config existe');
      console.log(`📋 Registros encontrados: ${rewardsConfig?.length || 0}`);
      if (rewardsConfig && rewardsConfig.length > 0) {
        console.log('🔧 Configuraciones activas:', rewardsConfig.filter(c => c.is_active));
      }
    }

    // 2. Verificar tabla seller_reward_tiers
    console.log('\n📊 2. Verificando seller_reward_tiers...');
    const { data: rewardTiers, error: tiersError } = await supabase
      .from('seller_reward_tiers')
      .select('*')
      .limit(5);

    if (tiersError) {
      console.log('❌ Error en seller_reward_tiers:', tiersError.message);
    } else {
      console.log('✅ seller_reward_tiers existe');
      console.log(`📋 Registros encontrados: ${rewardTiers?.length || 0}`);
    }

    // 3. Verificar tabla points_history
    console.log('\n📊 3. Verificando points_history...');
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.log('❌ Error en points_history:', historyError.message);
    } else {
      console.log('✅ points_history existe');
      console.log(`📋 Registros encontrados: ${pointsHistory?.length || 0}`);
      if (pointsHistory && pointsHistory.length > 0) {
        console.log('🕒 Últimas transacciones:');
        pointsHistory.forEach((transaction, index) => {
          console.log(`  ${index + 1}. ${transaction.transaction_type}: ${transaction.points_earned || transaction.points_spent} puntos (${new Date(transaction.created_at).toLocaleString()})`);
        });
      }
    }

    // 4. Verificar tabla user_points
    console.log('\n📊 4. Verificando user_points...');
    const { data: userPoints, error: userPointsError } = await supabase
      .from('user_points')
      .select('*')
      .limit(10);

    if (userPointsError) {
      console.log('❌ Error en user_points:', userPointsError.message);
    } else {
      console.log('✅ user_points existe');
      console.log(`📋 Registros encontrados: ${userPoints?.length || 0}`);
      if (userPoints && userPoints.length > 0) {
        console.log('👤 Puntos por usuario:');
        userPoints.forEach((userPoint, index) => {
          console.log(`  ${index + 1}. Usuario: ${userPoint.user_id.substring(0, 8)}... - Puntos: ${userPoint.points}`);
        });
      }
    }

    // 5. Verificar tabla point_redemptions
    console.log('\n📊 5. Verificando point_redemptions...');
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('point_redemptions')
      .select('*')
      .limit(5);

    if (redemptionsError) {
      console.log('❌ Error en point_redemptions:', redemptionsError.message);
    } else {
      console.log('✅ point_redemptions existe');
      console.log(`📋 Registros encontrados: ${redemptions?.length || 0}`);
    }

    // 6. Verificar pedidos recientes
    console.log('\n📊 6. Verificando pedidos recientes...');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_cents, status, created_at, user_id, seller_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.log('❌ Error en orders:', ordersError.message);
    } else {
      console.log('✅ orders existe');
      console.log(`📋 Pedidos recientes: ${recentOrders?.length || 0}`);
      if (recentOrders && recentOrders.length > 0) {
        console.log('🛒 Últimos pedidos:');
        recentOrders.forEach((order, index) => {
          console.log(`  ${index + 1}. ID: ${order.id.substring(0, 8)}... - Total: $${order.total_cents / 100} - Estado: ${order.status} (${new Date(order.created_at).toLocaleString()})`);
        });
      }
    }

    // 7. Verificar si hay configuración activa para vendedores
    console.log('\n📊 7. Verificando configuraciones activas...');
    const { data: activeConfigs, error: activeConfigsError } = await supabase
      .from('seller_rewards_config')
      .select('seller_id, is_active, minimum_purchase_cents, points_per_peso')
      .eq('is_active', true);

    if (activeConfigsError) {
      console.log('❌ Error obteniendo configuraciones activas:', activeConfigsError.message);
    } else {
      console.log(`✅ Configuraciones activas: ${activeConfigs?.length || 0}`);
      if (activeConfigs && activeConfigs.length > 0) {
        activeConfigs.forEach((config, index) => {
          console.log(`  ${index + 1}. Vendedor: ${config.seller_id.substring(0, 8)}... - Mínimo: $${config.minimum_purchase_cents / 100} - Puntos por peso: ${config.points_per_peso}`);
        });
      } else {
        console.log('⚠️  NO HAY CONFIGURACIONES ACTIVAS - ESTE ES EL PROBLEMA!');
      }
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    if (!rewardsConfig || rewardsConfig.length === 0) {
      console.log('❌ PROBLEMA: No hay configuraciones de recompensas');
    }
    if (!activeConfigs || activeConfigs.length === 0) {
      console.log('❌ PROBLEMA: No hay configuraciones activas');
    }
    if (!pointsHistory || pointsHistory.length === 0) {
      console.log('❌ PROBLEMA: No hay historial de puntos');
    }

  } catch (error) {
    console.error('❌ Error verificando tablas:', error);
  }
}

checkPointsTables();





