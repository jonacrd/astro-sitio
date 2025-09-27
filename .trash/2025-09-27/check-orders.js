#!/usr/bin/env node

/**
 * Script para verificar y limpiar pedidos de prueba
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

async function checkOrders() {
  console.log('🔍 Verificando pedidos existentes...\n');

  try {
    // 1. Verificar todos los pedidos
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        seller_id,
        total_cents,
        status,
        created_at,
        buyer:profiles!orders_user_id_fkey(name),
        seller:profiles!orders_seller_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    console.log(`📊 Total de pedidos: ${orders?.length || 0}\n`);

    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`${index + 1}. Pedido ${order.id.substring(0, 8)}`);
        console.log(`   Comprador: ${order.buyer?.name || 'N/A'}`);
        console.log(`   Vendedor: ${order.seller?.name || 'N/A'}`);
        console.log(`   Total: $${(order.total_cents / 100).toFixed(2)}`);
        console.log(`   Estado: ${order.status}`);
        console.log(`   Fecha: ${new Date(order.created_at).toLocaleString('es-ES')}`);
        console.log('');
      });
    }

    // 2. Verificar notificaciones
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        type,
        title,
        message,
        order_id,
        read_at,
        created_at,
        user:profiles!notifications_user_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (notifError) {
      console.log('⚠️ No se pudo cargar notificaciones:', notifError.message);
    } else {
      console.log(`📢 Total de notificaciones: ${notifications?.length || 0}\n`);
      
      if (notifications && notifications.length > 0) {
        notifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title}`);
          console.log(`   Para: ${notif.user?.name || 'N/A'}`);
          console.log(`   Tipo: ${notif.type}`);
          console.log(`   Leída: ${notif.read_at ? 'Sí' : 'No'}`);
          console.log(`   Fecha: ${new Date(notif.created_at).toLocaleString('es-ES')}`);
          console.log('');
        });
      }
    }

    // 3. Preguntar si quiere limpiar
    console.log('🧹 ¿Quieres limpiar todos los pedidos y notificaciones de prueba?');
    console.log('   Esto eliminará todos los datos para empezar limpio.');
    console.log('   Presiona Ctrl+C para cancelar o Enter para continuar...');
    
    // Esperar input del usuario
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', async (key) => {
      if (key.toString() === '\r' || key.toString() === '\n') {
        await cleanData();
        process.exit(0);
      } else if (key.toString() === '\u0003') { // Ctrl+C
        console.log('\n❌ Operación cancelada');
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('❌ Error verificando pedidos:', error);
    process.exit(1);
  }
}

async function cleanData() {
  console.log('\n🧹 Limpiando datos de prueba...');

  try {
    // Eliminar notificaciones
    const { error: notifError } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todas

    if (notifError) {
      console.log('⚠️ Error eliminando notificaciones:', notifError.message);
    } else {
      console.log('✅ Notificaciones eliminadas');
    }

    // Eliminar pedidos
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todas

    if (ordersError) {
      console.log('⚠️ Error eliminando pedidos:', ordersError.message);
    } else {
      console.log('✅ Pedidos eliminados');
    }

    // Eliminar items del carrito
    const { error: cartItemsError } = await supabase
      .from('cart_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (cartItemsError) {
      console.log('⚠️ Error eliminando items del carrito:', cartItemsError.message);
    } else {
      console.log('✅ Items del carrito eliminados');
    }

    // Eliminar carritos
    const { error: cartsError } = await supabase
      .from('carts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (cartsError) {
      console.log('⚠️ Error eliminando carritos:', cartsError.message);
    } else {
      console.log('✅ Carritos eliminados');
    }

    console.log('\n🎉 ¡Datos limpiados exitosamente!');
    console.log('   Ahora puedes hacer un pedido nuevo para probar el flujo completo.');

  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  }
}

checkOrders();



