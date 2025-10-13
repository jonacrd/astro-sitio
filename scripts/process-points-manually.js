#!/usr/bin/env node

/**
 * Script para procesar puntos manualmente
 * Ejecutar con: node scripts/process-points-manually.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processPointsManually() {
  console.log('🎯 Procesando puntos manualmente...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // IDs reales obtenidos del diagnóstico anterior
    const userId = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1
    const sellerId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore

    console.log(`\n📊 Procesando puntos para usuario: ${userId}`);
    console.log(`📊 Procesando puntos para vendedor: ${sellerId}`);

    // 1. Obtener pedidos completados del usuario
    console.log('\n📊 1. Obteniendo pedidos completados...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('seller_id', sellerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
      return;
    }

    console.log(`✅ Pedidos encontrados: ${orders.length}`);
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Pedido ${order.id.substring(0, 8)} - $${order.total_cents / 100} - ${order.created_at}`);
    });

    // 2. Obtener configuración de recompensas
    console.log('\n📊 2. Obteniendo configuración de recompensas...');
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .single();

    if (configError) {
      console.error('❌ Error obteniendo configuración:', configError);
      return;
    }

    console.log('✅ Configuración encontrada:', rewardsConfig);

    // 3. Procesar cada pedido
    for (const order of orders) {
      console.log(`\n📊 3. Procesando pedido ${order.id.substring(0, 8)}...`);
      
      // Verificar si ya tiene puntos
      const { data: existingPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .eq('seller_id', sellerId);

      if (pointsError) {
        console.error('❌ Error verificando puntos existentes:', pointsError);
        continue;
      }

      if (existingPoints && existingPoints.length > 0) {
        console.log('⚠️  Usuario ya tiene puntos, saltando...');
        continue;
      }

      // Verificar si cumple mínimo
      if (order.total_cents < rewardsConfig.minimum_purchase_cents) {
        console.log(`⚠️  Pedido de $${order.total_cents / 100} no cumple mínimo de $${rewardsConfig.minimum_purchase_cents / 100}`);
        continue;
      }

      // Calcular puntos
      const pointsEarned = Math.floor((order.total_cents / 100) * rewardsConfig.points_per_peso);
      console.log(`💰 Puntos a otorgar: ${pointsEarned}`);

      // Crear puntos del usuario
      const { error: userPointsError } = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          seller_id: sellerId,
          points: pointsEarned,
          source: 'order',
          order_id: order.id
        });

      if (userPointsError) {
        console.error('❌ Error creando puntos del usuario:', userPointsError);
        continue;
      }

      // Crear historial de puntos
      const { error: historyError } = await supabase
        .from('points_history')
        .insert({
          user_id: userId,
          seller_id: sellerId,
          order_id: order.id,
          points_earned: pointsEarned,
          transaction_type: 'earned',
          description: `Puntos ganados por compra de $${order.total_cents / 100}`
        });

      if (historyError) {
        console.error('❌ Error creando historial:', historyError);
        continue;
      }

      console.log(`✅ Puntos procesados exitosamente: ${pointsEarned}`);
    }

    // 4. Verificar resultado final
    console.log('\n📊 4. Verificando resultado final...');
    const { data: finalPoints, error: finalError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .eq('seller_id', sellerId);

    if (finalError) {
      console.error('❌ Error verificando puntos finales:', finalError);
    } else {
      console.log('✅ Puntos finales:', finalPoints);
    }

    const { data: finalHistory, error: historyFinalError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId);

    if (historyFinalError) {
      console.error('❌ Error verificando historial final:', historyFinalError);
    } else {
      console.log('✅ Historial final:', finalHistory);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

processPointsManually();














