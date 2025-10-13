#!/usr/bin/env node

/**
 * Script para corregir la configuración de puntos
 * Ejecutar con: node scripts/fix-points-config.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPointsConfig() {
  console.log('🔧 Corrigiendo configuración de puntos...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    const sellerId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore

    console.log(`\n📊 Corrigiendo configuración para vendedor: ${sellerId}`);

    // 1. Actualizar configuración de recompensas
    console.log('\n📊 1. Actualizando configuración de recompensas...');
    const { error: configError } = await supabase
      .from('seller_rewards_config')
      .update({
        points_per_peso: 0.001, // 1 punto por cada $1,000 pesos
        minimum_purchase_cents: 500000, // $5,000 mínimo
        updated_at: new Date().toISOString()
      })
      .eq('seller_id', sellerId);

    if (configError) {
      console.error('❌ Error actualizando configuración:', configError);
    } else {
      console.log('✅ Configuración actualizada correctamente');
    }

    // 2. Actualizar niveles de recompensa
    console.log('\n📊 2. Actualizando niveles de recompensa...');
    
    // Eliminar niveles existentes
    const { error: deleteError } = await supabase
      .from('seller_reward_tiers')
      .delete()
      .eq('seller_id', sellerId);

    if (deleteError) {
      console.error('❌ Error eliminando niveles:', deleteError);
    } else {
      console.log('✅ Niveles anteriores eliminados');
    }

    // Crear nuevos niveles
    const newTiers = [
      {
        seller_id: sellerId,
        tier_name: 'Bronce',
        minimum_purchase_cents: 500000, // $5,000
        points_multiplier: 1.0,
        description: 'Nivel básico - 1 punto por cada $1,000 pesos',
        is_active: true
      },
      {
        seller_id: sellerId,
        tier_name: 'Plata',
        minimum_purchase_cents: 1000000, // $10,000
        points_multiplier: 1.0,
        description: 'Nivel intermedio - 1 punto por cada $1,000 pesos',
        is_active: true
      },
      {
        seller_id: sellerId,
        tier_name: 'Oro',
        minimum_purchase_cents: 2000000, // $20,000
        points_multiplier: 1.0,
        description: 'Nivel premium - 1 punto por cada $1,000 pesos',
        is_active: true
      }
    ];

    const { error: insertError } = await supabase
      .from('seller_reward_tiers')
      .insert(newTiers);

    if (insertError) {
      console.error('❌ Error creando niveles:', insertError);
    } else {
      console.log('✅ Nuevos niveles creados');
    }

    // 3. Recalcular puntos existentes
    console.log('\n📊 3. Recalculando puntos existentes...');
    
    // Obtener pedidos existentes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_cents, user_id')
      .eq('seller_id', sellerId)
      .eq('status', 'completed');

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
    } else {
      console.log(`✅ Pedidos encontrados: ${orders.length}`);
      
      for (const order of orders) {
        // Calcular puntos correctos
        const correctPoints = Math.floor(order.total_cents / 1000); // 1 punto por $1,000
        
        // Actualizar user_points
        const { error: updatePointsError } = await supabase
          .from('user_points')
          .update({ points: correctPoints })
          .eq('user_id', order.user_id)
          .eq('seller_id', sellerId);

        if (updatePointsError) {
          console.error(`❌ Error actualizando puntos para pedido ${order.id}:`, updatePointsError);
        } else {
          console.log(`✅ Puntos actualizados para pedido ${order.id}: ${correctPoints}`);
        }

        // Actualizar points_history
        const { error: updateHistoryError } = await supabase
          .from('points_history')
          .update({ 
            points_earned: correctPoints,
            description: `Puntos ganados por compra de $${order.total_cents / 100} (1 punto por $1,000)`
          })
          .eq('order_id', order.id);

        if (updateHistoryError) {
          console.error(`❌ Error actualizando historial para pedido ${order.id}:`, updateHistoryError);
        } else {
          console.log(`✅ Historial actualizado para pedido ${order.id}`);
        }
      }
    }

    // 4. Verificar resultado final
    console.log('\n📊 4. Verificando resultado final...');
    const { data: finalPoints, error: finalError } = await supabase
      .from('user_points')
      .select('*')
      .eq('seller_id', sellerId);

    if (finalError) {
      console.error('❌ Error verificando puntos finales:', finalError);
    } else {
      console.log('✅ Puntos finales:', finalPoints);
    }

    console.log('\n🎯 CONFIGURACIÓN CORREGIDA:');
    console.log('• 1 punto = $1,000 pesos');
    console.log('• Compra mínima: $5,000 = 5 puntos');
    console.log('• $10,000 = 10 puntos');
    console.log('• $20,000 = 20 puntos');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

fixPointsConfig();














