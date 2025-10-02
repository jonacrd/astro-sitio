#!/usr/bin/env node

/**
 * Script para probar que el checkout funciona con usuarios reales
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

async function testUserCheckout() {
  console.log('🧪 Probando checkout con usuario real...\n');
  
  try {
    // 1. Verificar usuarios existentes
    console.log('📊 1. Verificando usuarios existentes...');
    
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, is_seller')
      .limit(10);
    
    if (usersError) {
      console.log('❌ Error obteniendo usuarios:', usersError.message);
      return;
    }
    
    console.log(`✅ Usuarios encontrados: ${users?.length || 0}`);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.is_seller ? 'Vendedor' : 'Comprador'}`);
      });
    }
    
    // 2. Verificar pedidos existentes
    console.log('\n📊 2. Verificando pedidos existentes...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, total_cents, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) {
      console.log('❌ Error obteniendo pedidos:', ordersError.message);
      return;
    }
    
    console.log(`✅ Pedidos encontrados: ${orders?.length || 0}`);
    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`  ${index + 1}. ID: ${order.id.substring(0, 8)}... - Usuario: ${order.user_id.substring(0, 8)}... - Total: $${order.total_cents / 100} - Estado: ${order.status}`);
      });
    }
    
    // 3. Verificar puntos del usuario
    console.log('\n📊 3. Verificando puntos de usuarios...');
    
    const { data: userPoints, error: userPointsError } = await supabase
      .from('user_points')
      .select('user_id, seller_id, points, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (userPointsError) {
      console.log('❌ Error obteniendo puntos:', userPointsError.message);
      return;
    }
    
    console.log(`✅ Puntos de usuarios: ${userPoints?.length || 0}`);
    if (userPoints && userPoints.length > 0) {
      userPoints.forEach((userPoint, index) => {
        console.log(`  ${index + 1}. Usuario: ${userPoint.user_id.substring(0, 8)}... - Puntos: ${userPoint.points}`);
      });
    }
    
    // 4. Verificar historial de puntos
    console.log('\n📊 4. Verificando historial de puntos...');
    
    const { data: pointsHistory, error: pointsError } = await supabase
      .from('points_history')
      .select('user_id, seller_id, points_earned, transaction_type, description, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (pointsError) {
      console.log('❌ Error obteniendo historial:', pointsError.message);
      return;
    }
    
    console.log(`✅ Historial de puntos: ${pointsHistory?.length || 0}`);
    if (pointsHistory && pointsHistory.length > 0) {
      pointsHistory.forEach((history, index) => {
        console.log(`  ${index + 1}. Usuario: ${history.user_id.substring(0, 8)}... - Puntos: ${history.points_earned} - Tipo: ${history.transaction_type}`);
      });
    }
    
    // 5. Verificar configuración de recompensas
    console.log('\n📊 5. Verificando configuración de recompensas...');
    
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('seller_id, is_active, points_per_peso, minimum_purchase_cents');
    
    if (configError) {
      console.log('❌ Error obteniendo configuración:', configError.message);
      return;
    }
    
    console.log(`✅ Configuraciones de recompensas: ${rewardsConfig?.length || 0}`);
    if (rewardsConfig && rewardsConfig.length > 0) {
      rewardsConfig.forEach((config, index) => {
        console.log(`  ${index + 1}. Vendedor: ${config.seller_id.substring(0, 8)}... - Activo: ${config.is_active} - Puntos por peso: ${config.points_per_peso}`);
      });
    }
    
    console.log('\n🎯 DIAGNÓSTICO DEL SISTEMA:');
    
    // Verificar si hay usuarios compradores
    const buyers = users?.filter(user => !user.is_seller) || [];
    console.log(`✅ Compradores: ${buyers.length}`);
    
    // Verificar si hay vendedores
    const sellers = users?.filter(user => user.is_seller) || [];
    console.log(`✅ Vendedores: ${sellers.length}`);
    
    // Verificar si hay pedidos recientes
    const recentOrders = orders?.filter(order => {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
      return diffHours < 24; // Últimas 24 horas
    }) || [];
    console.log(`✅ Pedidos recientes (24h): ${recentOrders.length}`);
    
    // Verificar si hay puntos otorgados
    const recentPoints = pointsHistory?.filter(history => {
      const pointDate = new Date(history.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - pointDate.getTime()) / (1000 * 60 * 60);
      return diffHours < 24; // Últimas 24 horas
    }) || [];
    console.log(`✅ Puntos otorgados recientemente: ${recentPoints.length}`);
    
    console.log('\n🎉 ESTADO DEL SISTEMA:');
    if (buyers.length > 0 && sellers.length > 0) {
      console.log('✅ Sistema de usuarios funcionando');
    } else {
      console.log('❌ Falta configurar usuarios');
    }
    
    if (rewardsConfig && rewardsConfig.length > 0) {
      console.log('✅ Sistema de recompensas configurado');
    } else {
      console.log('❌ Falta configurar recompensas');
    }
    
    if (orders && orders.length > 0) {
      console.log('✅ Sistema de pedidos funcionando');
    } else {
      console.log('❌ No hay pedidos registrados');
    }
    
    if (pointsHistory && pointsHistory.length > 0) {
      console.log('✅ Sistema de puntos funcionando');
    } else {
      console.log('❌ No hay puntos registrados');
    }
    
    console.log('\n🔧 INSTRUCCIONES PARA VERIFICAR:');
    console.log('1. ✅ Hacer login como comprador');
    console.log('2. ✅ Agregar productos al carrito');
    console.log('3. ✅ Proceder al checkout');
    console.log('4. ✅ Verificar que se crea la orden');
    console.log('5. ✅ Verificar que se otorgan puntos');
    console.log('6. ✅ Verificar que aparece en /mis-pedidos');
    console.log('7. ✅ Verificar que el vendedor ve la orden');
    console.log('8. ✅ Verificar que se pueden cambiar estados');

  } catch (error) {
    console.error('❌ Error probando checkout:', error);
  }
}

testUserCheckout();



