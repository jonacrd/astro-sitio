#!/usr/bin/env node

/**
 * Script para probar la actualización de pedidos directamente
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOrderUpdate() {
  console.log('🔍 Probando actualización de pedidos...\n');

  try {
    // 1. Ver todos los pedidos
    console.log('📦 Pedidos actuales:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, status, total_cents, created_at')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
      return;
    }

    console.log(`Total de pedidos: ${orders?.length || 0}`);
    orders?.forEach((order, index) => {
      console.log(`${index + 1}. ${order.id.substring(0, 8)} - Status: ${order.status} - User: ${order.user_id} - Seller: ${order.seller_id}`);
    });

    // 2. Buscar un pedido entregado para probar
    const deliveredOrder = orders?.find(order => order.status === 'delivered');
    
    if (!deliveredOrder) {
      console.log('⚠️ No hay pedidos entregados para probar');
      return;
    }

    console.log(`\n🎯 Probando actualización del pedido: ${deliveredOrder.id.substring(0, 8)}`);

    // 3. Intentar actualizar el pedido
    const { data: updateData, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', deliveredOrder.id)
      .select();

    if (updateError) {
      console.error('❌ Error actualizando pedido:', updateError);
      console.log('💡 Posibles causas:');
      console.log('   - RLS (Row Level Security) bloqueando la actualización');
      console.log('   - Permisos insuficientes');
      console.log('   - La tabla orders no existe o tiene estructura diferente');
      return;
    }

    console.log('✅ Pedido actualizado exitosamente:', updateData);

    // 4. Verificar que se guardó
    const { data: verifyData, error: verifyError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', deliveredOrder.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verificando actualización:', verifyError);
      return;
    }

    console.log('🔍 Estado después de la actualización:', verifyData);

    // 5. Crear notificación de prueba
    console.log('\n📢 Probando creación de notificación...');
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: deliveredOrder.seller_id,
        type: 'order_completed',
        title: '¡Pedido Completado! (Prueba)',
        message: 'El comprador ha confirmado la recepción del pedido.',
        order_id: deliveredOrder.id
      })
      .select();

    if (notifError) {
      console.error('❌ Error creando notificación:', notifError);
      console.log('💡 Posibles causas:');
      console.log('   - Tabla notifications no existe');
      console.log('   - RLS bloqueando la inserción');
      console.log('   - Permisos insuficientes');
    } else {
      console.log('✅ Notificación creada exitosamente:', notifData);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testOrderUpdate();
