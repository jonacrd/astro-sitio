#!/usr/bin/env node

/**
 * Script para limpiar datos de prueba
 * Ejecutar con: node scripts/clean-test-data.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanTestData() {
  console.log('🧹 Limpiando datos de prueba...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    const userId = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1
    const sellerId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore

    console.log(`\n📊 Limpiando datos para usuario: ${userId}`);
    console.log(`📊 Limpiando datos para vendedor: ${sellerId}`);

    // 1. Limpiar puntos del usuario
    console.log('\n📊 1. Limpiando puntos del usuario...');
    const { error: pointsError } = await supabase
      .from('user_points')
      .delete()
      .eq('user_id', userId);

    if (pointsError) {
      console.error('❌ Error eliminando puntos:', pointsError);
    } else {
      console.log('✅ Puntos del usuario eliminados');
    }

    // 2. Limpiar historial de puntos
    console.log('\n📊 2. Limpiando historial de puntos...');
    const { error: historyError } = await supabase
      .from('points_history')
      .delete()
      .eq('user_id', userId);

    if (historyError) {
      console.error('❌ Error eliminando historial:', historyError);
    } else {
      console.log('✅ Historial de puntos eliminado');
    }

    // 3. Limpiar pedidos del usuario
    console.log('\n📊 3. Limpiando pedidos del usuario...');
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('user_id', userId);

    if (ordersError) {
      console.error('❌ Error eliminando pedidos:', ordersError);
    } else {
      console.log('✅ Pedidos del usuario eliminados');
    }

    // 4. Limpiar items de pedidos
    console.log('\n📊 4. Limpiando items de pedidos...');
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('user_id', userId);

    if (orderItemsError) {
      console.error('❌ Error eliminando items de pedidos:', orderItemsError);
    } else {
      console.log('✅ Items de pedidos eliminados');
    }

    // 5. Limpiar carritos del usuario
    console.log('\n📊 5. Limpiando carritos del usuario...');
    const { error: cartsError } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId);

    if (cartsError) {
      console.error('❌ Error eliminando carritos:', cartsError);
    } else {
      console.log('✅ Carritos del usuario eliminados');
    }

    // 6. Limpiar items de carritos
    console.log('\n📊 6. Limpiando items de carritos...');
    const { error: cartItemsError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (cartItemsError) {
      console.error('❌ Error eliminando items de carritos:', cartItemsError);
    } else {
      console.log('✅ Items de carritos eliminados');
    }

    // 7. Limpiar notificaciones del usuario
    console.log('\n📊 7. Limpiando notificaciones del usuario...');
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      console.error('❌ Error eliminando notificaciones:', notificationsError);
    } else {
      console.log('✅ Notificaciones del usuario eliminadas');
    }

    // 8. Limpiar pedidos del vendedor (opcional)
    console.log('\n📊 8. Limpiando pedidos del vendedor...');
    const { error: sellerOrdersError } = await supabase
      .from('orders')
      .delete()
      .eq('seller_id', sellerId);

    if (sellerOrdersError) {
      console.error('❌ Error eliminando pedidos del vendedor:', sellerOrdersError);
    } else {
      console.log('✅ Pedidos del vendedor eliminados');
    }

    // 9. Verificar limpieza
    console.log('\n📊 9. Verificando limpieza...');
    
    const { data: remainingPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId);

    const { data: remainingOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    const { data: remainingHistory } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId);

    console.log('✅ Verificación completada:');
    console.log(`   - Puntos restantes: ${remainingPoints?.length || 0}`);
    console.log(`   - Pedidos restantes: ${remainingOrders?.length || 0}`);
    console.log(`   - Historial restante: ${remainingHistory?.length || 0}`);

    console.log('\n🎯 LIMPIEZA COMPLETADA');
    console.log('• Usuario sin puntos');
    console.log('• Usuario sin historial de compras');
    console.log('• Vendedor sin historial de ventas');
    console.log('• Listo para nuevas pruebas');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

cleanTestData();









