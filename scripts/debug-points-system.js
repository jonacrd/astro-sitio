#!/usr/bin/env node

/**
 * Script para debuggear el sistema de puntos
 * Ejecutar con: node scripts/debug-points-system.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPointsSystem() {
  console.log('🔍 Debuggeando sistema de puntos...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // 1. Verificar configuración de recompensas de techstore
    console.log('\n📊 1. Verificando configuración de recompensas de techstore...');
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('*')
      .eq('seller_id', 'techstore');

    if (configError) {
      console.error('❌ Error obteniendo configuración:', configError);
    } else {
      console.log('✅ Configuración de recompensas:', rewardsConfig);
    }

    // 2. Verificar niveles de recompensa
    console.log('\n📊 2. Verificando niveles de recompensa...');
    const { data: rewardTiers, error: tiersError } = await supabase
      .from('seller_reward_tiers')
      .select('*')
      .eq('seller_id', 'techstore');

    if (tiersError) {
      console.error('❌ Error obteniendo niveles:', tiersError);
    } else {
      console.log('✅ Niveles de recompensa:', rewardTiers);
    }

    // 3. Verificar puntos de comprador1
    console.log('\n📊 3. Verificando puntos de comprador1...');
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', 'comprador1');

    if (pointsError) {
      console.error('❌ Error obteniendo puntos:', pointsError);
    } else {
      console.log('✅ Puntos de comprador1:', userPoints);
    }

    // 4. Verificar historial de puntos
    console.log('\n📊 4. Verificando historial de puntos...');
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', 'comprador1');

    if (historyError) {
      console.error('❌ Error obteniendo historial:', historyError);
    } else {
      console.log('✅ Historial de puntos:', pointsHistory);
    }

    // 5. Verificar pedidos recientes
    console.log('\n📊 5. Verificando pedidos recientes...');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', 'comprador1')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
    } else {
      console.log('✅ Pedidos recientes:', recentOrders);
    }

    // 6. Probar función place_order manualmente
    console.log('\n🧪 6. Probando función place_order...');
    const { data: testResult, error: testError } = await supabase.rpc('place_order', {
      user_id: 'comprador1',
      seller_id: 'techstore',
      payment_method: 'cash'
    });

    if (testError) {
      console.error('❌ Error probando place_order:', testError);
    } else {
      console.log('✅ Resultado de place_order:', testResult);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

debugPointsSystem();











