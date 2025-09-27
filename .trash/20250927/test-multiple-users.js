#!/usr/bin/env node

/**
 * Script para probar el sistema de puntos con múltiples usuarios
 * Ejecutar con: node scripts/test-multiple-users.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMultipleUsers() {
  console.log('🧪 Probando sistema de puntos con múltiples usuarios...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    const sellerId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore

    console.log(`\n📊 Probando con vendedor: ${sellerId}`);

    // 1. Obtener todos los usuarios
    console.log('\n📊 1. Obteniendo todos los usuarios...');
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .limit(10);

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    console.log(`✅ Usuarios encontrados: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.id.substring(0, 8)})`);
    });

    // 2. Verificar configuración de recompensas
    console.log('\n📊 2. Verificando configuración de recompensas...');
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

    // 3. Verificar pedidos de todos los usuarios
    console.log('\n📊 3. Verificando pedidos de todos los usuarios...');
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
      return;
    }

    console.log(`✅ Total de pedidos: ${allOrders.length}`);
    allOrders.forEach((order, index) => {
      console.log(`${index + 1}. Usuario ${order.user_id.substring(0, 8)} - $${order.total_cents / 100} - ${order.status} - ${order.created_at}`);
    });

    // 4. Verificar puntos de todos los usuarios
    console.log('\n📊 4. Verificando puntos de todos los usuarios...');
    const { data: allPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('seller_id', sellerId);

    if (pointsError) {
      console.error('❌ Error obteniendo puntos:', pointsError);
      return;
    }

    console.log(`✅ Total de usuarios con puntos: ${allPoints.length}`);
    allPoints.forEach((point, index) => {
      console.log(`${index + 1}. Usuario ${point.user_id.substring(0, 8)} - ${point.points} puntos - ${point.created_at}`);
    });

    // 5. Verificar historial de puntos
    console.log('\n📊 5. Verificando historial de puntos...');
    const { data: allHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('seller_id', sellerId);

    if (historyError) {
      console.error('❌ Error obteniendo historial:', historyError);
      return;
    }

    console.log(`✅ Total de transacciones de puntos: ${allHistory.length}`);
    allHistory.forEach((history, index) => {
      console.log(`${index + 1}. Usuario ${history.user_id.substring(0, 8)} - ${history.points_earned} puntos - ${history.description}`);
    });

    // 6. Procesar puntos para usuarios que no los tienen
    console.log('\n📊 6. Procesando puntos para usuarios sin puntos...');
    
    for (const order of allOrders) {
      if (order.status === 'completed') {
        // Verificar si ya tiene puntos
        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', order.user_id)
          .eq('seller_id', sellerId);

        if (!existingPoints || existingPoints.length === 0) {
          // Calcular puntos
          const pointsEarned = Math.floor(order.total_cents / 100000); // 1 punto por $1,000
          
          if (pointsEarned > 0) {
            console.log(`💰 Procesando puntos para usuario ${order.user_id.substring(0, 8)}: ${pointsEarned} puntos`);

            // Crear puntos
            const { error: userPointsError } = await supabase
              .from('user_points')
              .insert({
                user_id: order.user_id,
                seller_id: sellerId,
                points: pointsEarned,
                source: 'order',
                order_id: order.id
              });

            if (userPointsError) {
              console.error(`❌ Error creando puntos para usuario ${order.user_id.substring(0, 8)}:`, userPointsError);
              continue;
            }

            // Crear historial
            const { error: historyError } = await supabase
              .from('points_history')
              .insert({
                user_id: order.user_id,
                seller_id: sellerId,
                order_id: order.id,
                points_earned: pointsEarned,
                transaction_type: 'earned',
                description: `Puntos ganados por compra de $${order.total_cents / 100} (1 punto por $1,000)`
              });

            if (historyError) {
              console.error(`❌ Error creando historial para usuario ${order.user_id.substring(0, 8)}:`, historyError);
              continue;
            }

            console.log(`✅ Puntos procesados para usuario ${order.user_id.substring(0, 8)}: ${pointsEarned}`);
          }
        }
      }
    }

    // 7. Verificar resultado final
    console.log('\n📊 7. Verificando resultado final...');
    const { data: finalPoints, error: finalError } = await supabase
      .from('user_points')
      .select('*')
      .eq('seller_id', sellerId);

    if (finalError) {
      console.error('❌ Error verificando puntos finales:', finalError);
    } else {
      console.log(`✅ Total de usuarios con puntos: ${finalPoints.length}`);
      finalPoints.forEach((point, index) => {
        console.log(`${index + 1}. Usuario ${point.user_id.substring(0, 8)} - ${point.points} puntos`);
      });
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testMultipleUsers();
