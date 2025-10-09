#!/usr/bin/env node

/**
 * Script para arreglar el sistema de puntos
 * Ejecutar con: node scripts/fix-points-system.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPointsSystem() {
  console.log('🔧 Arreglando sistema de puntos...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // 1. Crear tabla user_points si no existe
    console.log('\n📊 1. Creando tabla user_points...');
    const createUserPointsSQL = `
      CREATE TABLE IF NOT EXISTS user_points (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        points INTEGER DEFAULT 0,
        source VARCHAR(50) DEFAULT 'order',
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, seller_id)
      );
    `;

    const { error: userPointsError } = await supabase.rpc('exec_sql', { 
      sql: createUserPointsSQL 
    });

    if (userPointsError) {
      console.error('❌ Error creando user_points:', userPointsError);
    } else {
      console.log('✅ Tabla user_points creada/verificada');
    }

    // 2. Crear tabla notifications si no existe
    console.log('\n📊 2. Creando tabla notifications...');
    const createNotificationsSQL = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: notificationsError } = await supabase.rpc('exec_sql', { 
      sql: createNotificationsSQL 
    });

    if (notificationsError) {
      console.error('❌ Error creando notifications:', notificationsError);
    } else {
      console.log('✅ Tabla notifications creada/verificada');
    }

    // 3. Verificar configuración de recompensas
    console.log('\n📊 3. Verificando configuración de recompensas...');
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('*');

    if (configError) {
      console.error('❌ Error obteniendo configuración:', configError);
    } else {
      console.log('✅ Configuración de recompensas:', rewardsConfig);
    }

    // 4. Verificar niveles de recompensa
    console.log('\n📊 4. Verificando niveles de recompensa...');
    const { data: rewardTiers, error: tiersError } = await supabase
      .from('seller_reward_tiers')
      .select('*');

    if (tiersError) {
      console.error('❌ Error obteniendo niveles:', tiersError);
    } else {
      console.log('✅ Niveles de recompensa:', rewardTiers);
    }

    // 5. Verificar pedidos recientes
    console.log('\n📊 5. Verificando pedidos recientes...');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
    } else {
      console.log('✅ Pedidos recientes:', recentOrders);
    }

    // 6. Verificar puntos existentes
    console.log('\n📊 6. Verificando puntos existentes...');
    const { data: existingPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*');

    if (pointsError) {
      console.error('❌ Error obteniendo puntos:', pointsError);
    } else {
      console.log('✅ Puntos existentes:', existingPoints);
    }

    // 7. Verificar historial de puntos
    console.log('\n📊 7. Verificando historial de puntos...');
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*');

    if (historyError) {
      console.error('❌ Error obteniendo historial:', historyError);
    } else {
      console.log('✅ Historial de puntos:', pointsHistory);
    }

    console.log('\n🎯 DIAGNÓSTICO COMPLETO');
    console.log('Si no hay puntos, el problema está en la función place_order');
    console.log('Verifica que la función se esté ejecutando correctamente');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

fixPointsSystem();










