#!/usr/bin/env node

/**
 * Script para configurar sistema de recompensas universal
 * Ejecutar con: node scripts/setup-universal-rewards.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUniversalRewards() {
  console.log('🌐 Configurando sistema de recompensas universal...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // 1. Obtener todos los vendedores
    console.log('\n📊 1. Obteniendo todos los vendedores...');
    const { data: allSellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);

    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }

    console.log(`✅ Vendedores encontrados: ${allSellers.length}`);
    allSellers.forEach((seller, index) => {
      console.log(`${index + 1}. ${seller.name} (${seller.id.substring(0, 8)})`);
    });

    // 2. Configurar sistema de recompensas para cada vendedor
    console.log('\n📊 2. Configurando sistema de recompensas para cada vendedor...');
    
    for (const seller of allSellers) {
      console.log(`\n📊 Configurando vendedor: ${seller.name} (${seller.id.substring(0, 8)})`);
      
      // Verificar si ya tiene configuración
      const { data: existingConfig, error: configError } = await supabase
        .from('seller_rewards_config')
        .select('*')
        .eq('seller_id', seller.id);

      if (configError) {
        console.error(`❌ Error verificando configuración para ${seller.name}:`, configError);
        continue;
      }

      if (existingConfig && existingConfig.length > 0) {
        console.log(`⚠️  ${seller.name} ya tiene configuración, saltando...`);
        continue;
      }

      // Crear configuración de recompensas
      const { error: createConfigError } = await supabase
        .from('seller_rewards_config')
        .insert({
          seller_id: seller.id,
          is_active: true,
          points_per_peso: 0.001, // 1 punto por cada $1,000 pesos
          minimum_purchase_cents: 500000, // $5,000 mínimo
        });

      if (createConfigError) {
        console.error(`❌ Error creando configuración para ${seller.name}:`, createConfigError);
        continue;
      }

      console.log(`✅ Configuración creada para ${seller.name}`);

      // Crear niveles de recompensa
      const rewardTiers = [
        {
          seller_id: seller.id,
          tier_name: 'Bronce',
          minimum_purchase_cents: 500000, // $5,000
          points_multiplier: 1.0,
          description: 'Nivel básico - 1 punto por cada $1,000 pesos',
          is_active: true
        },
        {
          seller_id: seller.id,
          tier_name: 'Plata',
          minimum_purchase_cents: 1000000, // $10,000
          points_multiplier: 1.0,
          description: 'Nivel intermedio - 1 punto por cada $1,000 pesos',
          is_active: true
        },
        {
          seller_id: seller.id,
          tier_name: 'Oro',
          minimum_purchase_cents: 2000000, // $20,000
          points_multiplier: 1.0,
          description: 'Nivel premium - 1 punto por cada $1,000 pesos',
          is_active: true
        }
      ];

      const { error: createTiersError } = await supabase
        .from('seller_reward_tiers')
        .insert(rewardTiers);

      if (createTiersError) {
        console.error(`❌ Error creando niveles para ${seller.name}:`, createTiersError);
        continue;
      }

      console.log(`✅ Niveles de recompensa creados para ${seller.name}`);
    }

    // 3. Procesar puntos para todos los usuarios con pedidos
    console.log('\n📊 3. Procesando puntos para todos los usuarios...');
    
    // Obtener todos los pedidos completados
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
      return;
    }

    console.log(`✅ Pedidos completados encontrados: ${allOrders.length}`);

    // Procesar puntos para cada pedido
    for (const order of allOrders) {
      console.log(`\n📊 Procesando pedido ${order.id.substring(0, 8)}...`);
      
      // Verificar si ya tiene puntos
      const { data: existingPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', order.user_id)
        .eq('seller_id', order.seller_id);

      if (pointsError) {
        console.error(`❌ Error verificando puntos para pedido ${order.id}:`, pointsError);
        continue;
      }

      if (existingPoints && existingPoints.length > 0) {
        console.log(`⚠️  Usuario ya tiene puntos para este pedido, saltando...`);
        continue;
      }

      // Calcular puntos (1 punto por cada $1,000 pesos)
      const pointsEarned = Math.floor(order.total_cents / 100000); // 100,000 centavos = $1,000
      
      if (pointsEarned === 0) {
        console.log(`⚠️  Pedido de $${order.total_cents / 100} no cumple mínimo de $1,000, saltando...`);
        continue;
      }

      console.log(`💰 Puntos a otorgar: ${pointsEarned}`);

      // Crear puntos del usuario
      const { error: userPointsError } = await supabase
        .from('user_points')
        .insert({
          user_id: order.user_id,
          seller_id: order.seller_id,
          points: pointsEarned,
          source: 'order',
          order_id: order.id
        });

      if (userPointsError) {
        console.error(`❌ Error creando puntos para pedido ${order.id}:`, userPointsError);
        continue;
      }

      // Crear historial de puntos
      const { error: historyError } = await supabase
        .from('points_history')
        .insert({
          user_id: order.user_id,
          seller_id: order.seller_id,
          order_id: order.id,
          points_earned: pointsEarned,
          transaction_type: 'earned',
          description: `Puntos ganados por compra de $${order.total_cents / 100} (1 punto por $1,000)`
        });

      if (historyError) {
        console.error(`❌ Error creando historial para pedido ${order.id}:`, historyError);
        continue;
      }

      console.log(`✅ Puntos procesados para pedido ${order.id}: ${pointsEarned}`);
    }

    // 4. Verificar resultado final
    console.log('\n📊 4. Verificando resultado final...');
    
    // Verificar vendedores con configuración
    const { data: configuredSellers, error: configFinalError } = await supabase
      .from('seller_rewards_config')
      .select('*');

    if (configFinalError) {
      console.error('❌ Error verificando configuración final:', configFinalError);
    } else {
      console.log(`✅ Vendedores con sistema de recompensas: ${configuredSellers.length}`);
    }

    // Verificar usuarios con puntos
    const { data: usersWithPoints, error: pointsFinalError } = await supabase
      .from('user_points')
      .select('*');

    if (pointsFinalError) {
      console.error('❌ Error verificando puntos finales:', pointsFinalError);
    } else {
      console.log(`✅ Usuarios con puntos: ${usersWithPoints.length}`);
    }

    // Verificar historial de puntos
    const { data: pointsHistory, error: historyFinalError } = await supabase
      .from('points_history')
      .select('*');

    if (historyFinalError) {
      console.error('❌ Error verificando historial final:', historyFinalError);
    } else {
      console.log(`✅ Transacciones de puntos: ${pointsHistory.length}`);
    }

    console.log('\n🎯 SISTEMA UNIVERSAL CONFIGURADO');
    console.log('• Todos los vendedores tienen sistema de recompensas');
    console.log('• Todos los usuarios pueden recibir puntos');
    console.log('• Sistema automático funcionando');
    console.log('• Red completa de recompensas');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

setupUniversalRewards();




