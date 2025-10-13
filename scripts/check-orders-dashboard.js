#!/usr/bin/env node

/**
 * Script para verificar pedidos en el dashboard de vendedores
 */

import { createClient } from '@supabase/supabase-js';

async function checkOrdersDashboard() {
  console.log('🔍 Verificando pedidos en el dashboard de vendedores...\n');
  
  try {
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
    const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar si existe la tabla orders
    console.log('📦 Verificando tabla orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);

    if (ordersError) {
      console.log('❌ Error obteniendo orders:', ordersError.message);
      console.log('💡 La tabla orders puede no existir o tener problemas de permisos');
      return;
    }

    console.log(`✅ Orders encontrados: ${orders?.length || 0}`);
    
    if (orders && orders.length > 0) {
      console.log('\n📋 PEDIDOS ENCONTRADOS:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ID: ${order.id}`);
        console.log(`   Cliente: ${order.user_id}`);
        console.log(`   Vendedor: ${order.seller_id}`);
        console.log(`   Total: $${order.total_cents}`);
        console.log(`   Estado: ${order.status}`);
        console.log(`   Fecha: ${order.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ NO HAY PEDIDOS EN LA BASE DE DATOS');
    }

    // Verificar vendedores activos
    console.log('👥 Verificando vendedores activos...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', ['f3fb7f84-9c00-4f3f-b8b2-a3827f0b2ec7', '8f0a8848-8647-41e7-b9d0-323ee000d379']);

    if (profilesError) {
      console.log('❌ Error obteniendo profiles:', profilesError.message);
    } else {
      console.log('✅ Vendedores activos:');
      profiles?.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.id})`);
      });
    }

    // Verificar si hay notificaciones
    console.log('\n🔔 Verificando notificaciones...');
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);

    if (notificationsError) {
      console.log('❌ Error obteniendo notifications:', notificationsError.message);
      console.log('💡 La tabla notifications puede no existir');
    } else {
      console.log(`✅ Notificaciones encontradas: ${notifications?.length || 0}`);
      if (notifications && notifications.length > 0) {
        notifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title} - ${notif.message}`);
        });
      }
    }

    console.log('\n📊 RESUMEN:');
    console.log(`✅ Pedidos: ${orders?.length || 0}`);
    console.log(`✅ Vendedores activos: ${profiles?.length || 0}`);
    console.log(`✅ Notificaciones: ${notifications?.length || 0}`);

    if (!orders || orders.length === 0) {
      console.log('\n💡 DIAGNÓSTICO:');
      console.log('❌ No hay pedidos en la base de datos');
      console.log('🔧 SOLUCIÓN: Crear un pedido de prueba para verificar el dashboard');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkOrdersDashboard();










