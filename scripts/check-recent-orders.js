#!/usr/bin/env node

/**
 * Script para verificar pedidos recientes
 * Ejecutar con: node scripts/check-recent-orders.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentOrders() {
  console.log('🔍 Verificando pedidos recientes...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    const userId = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1
    const sellerId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore

    console.log(`\n📊 Verificando pedidos para usuario: ${userId}`);
    console.log(`📊 Verificando pedidos para vendedor: ${sellerId}`);

    // 1. Verificar todos los pedidos del usuario
    console.log('\n📊 1. Todos los pedidos del usuario...');
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (allOrdersError) {
      console.error('❌ Error obteniendo pedidos:', allOrdersError);
    } else {
      console.log(`✅ Total de pedidos: ${allOrders.length}`);
      allOrders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.id.substring(0, 8)} - $${order.total_cents / 100} - ${order.status} - ${order.created_at}`);
      });
    }

    // 2. Verificar pedidos del vendedor
    console.log('\n📊 2. Todos los pedidos del vendedor...');
    const { data: sellerOrders, error: sellerOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (sellerOrdersError) {
      console.error('❌ Error obteniendo pedidos del vendedor:', sellerOrdersError);
    } else {
      console.log(`✅ Total de pedidos del vendedor: ${sellerOrders.length}`);
      sellerOrders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.id.substring(0, 8)} - $${order.total_cents / 100} - ${order.status} - ${order.created_at}`);
      });
    }

    // 3. Verificar puntos existentes
    console.log('\n📊 3. Puntos existentes...');
    const { data: existingPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId);

    if (pointsError) {
      console.error('❌ Error obteniendo puntos:', pointsError);
    } else {
      console.log(`✅ Puntos encontrados: ${existingPoints.length}`);
      existingPoints.forEach((point, index) => {
        console.log(`${index + 1}. ${point.points} puntos - ${point.created_at}`);
      });
    }

    // 4. Verificar historial de puntos
    console.log('\n📊 4. Historial de puntos...');
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId);

    if (historyError) {
      console.error('❌ Error obteniendo historial:', historyError);
    } else {
      console.log(`✅ Historial encontrado: ${pointsHistory.length}`);
      pointsHistory.forEach((history, index) => {
        console.log(`${index + 1}. ${history.points_earned} puntos - ${history.description} - ${history.created_at}`);
      });
    }

    // 5. Verificar configuración de recompensas
    console.log('\n📊 5. Configuración de recompensas...');
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('*')
      .eq('seller_id', sellerId);

    if (configError) {
      console.error('❌ Error obteniendo configuración:', configError);
    } else {
      console.log(`✅ Configuración encontrada: ${rewardsConfig.length}`);
      rewardsConfig.forEach((config, index) => {
        console.log(`${index + 1}. Activo: ${config.is_active} - Mínimo: $${config.minimum_purchase_cents / 100} - Puntos por peso: ${config.points_per_peso}`);
      });
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkRecentOrders();
