#!/usr/bin/env node

/**
 * Script para corregir puntos incorrectos
 * Ejecutar con: node scripts/fix-incorrect-points.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixIncorrectPoints() {
  console.log('🔧 Corrigiendo puntos incorrectos...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    const userId = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1
    const sellerId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore

    console.log(`\n📊 Corrigiendo puntos para usuario: ${userId}`);
    console.log(`📊 Corrigiendo puntos para vendedor: ${sellerId}`);

    // 1. Eliminar puntos incorrectos
    console.log('\n📊 1. Eliminando puntos incorrectos...');
    const { error: deletePointsError } = await supabase
      .from('user_points')
      .delete()
      .eq('user_id', userId)
      .eq('seller_id', sellerId);

    if (deletePointsError) {
      console.error('❌ Error eliminando puntos:', deletePointsError);
    } else {
      console.log('✅ Puntos incorrectos eliminados');
    }

    // 2. Eliminar historial incorrecto
    console.log('\n📊 2. Eliminando historial incorrecto...');
    const { error: deleteHistoryError } = await supabase
      .from('points_history')
      .delete()
      .eq('user_id', userId)
      .eq('seller_id', sellerId);

    if (deleteHistoryError) {
      console.error('❌ Error eliminando historial:', deleteHistoryError);
    } else {
      console.log('✅ Historial incorrecto eliminado');
    }

    // 3. Obtener pedidos completados
    console.log('\n📊 3. Obteniendo pedidos completados...');
    const { data: completedOrders, error: ordersError } = await supabase
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

    console.log(`✅ Pedidos completados encontrados: ${completedOrders.length}`);
    completedOrders.forEach((order, index) => {
      console.log(`${index + 1}. Pedido ${order.id.substring(0, 8)} - $${order.total_cents / 100} - ${order.created_at}`);
    });

    // 4. Recalcular puntos correctamente
    let totalPointsEarned = 0;
    
    for (const order of completedOrders) {
      console.log(`\n📊 4. Recalculando puntos para pedido ${order.id.substring(0, 8)}...`);
      
      // Calcular puntos correctos (1 punto por cada $1,000 pesos)
      const pointsEarned = Math.floor(order.total_cents / 100000); // 100,000 centavos = $1,000
      console.log(`💰 Puntos correctos a otorgar: ${pointsEarned}`);

      if (pointsEarned === 0) {
        console.log('⚠️  No cumple mínimo de $1,000, saltando...');
        continue;
      }

      // Crear puntos correctos
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
        console.error('❌ Error creando puntos correctos:', userPointsError);
        continue;
      }

      // Crear historial correcto
      const { error: historyError } = await supabase
        .from('points_history')
        .insert({
          user_id: userId,
          seller_id: sellerId,
          order_id: order.id,
          points_earned: pointsEarned,
          transaction_type: 'earned',
          description: `Puntos ganados por compra de $${order.total_cents / 100} (1 punto por $1,000)`
        });

      if (historyError) {
        console.error('❌ Error creando historial correcto:', historyError);
        continue;
      }

      console.log(`✅ Puntos correctos procesados: ${pointsEarned}`);
      totalPointsEarned += pointsEarned;
    }

    // 5. Verificar resultado final
    console.log('\n📊 5. Verificando resultado final...');
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

    console.log(`\n🎯 TOTAL DE PUNTOS CORRECTOS: ${totalPointsEarned}`);

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

fixIncorrectPoints();















