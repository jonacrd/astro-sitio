#!/usr/bin/env node

/**
 * Script para probar pedidos con columnas básicas
 * Ejecutar con: node scripts/test-basic-orders.js
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

async function testBasicOrders() {
  console.log('🧪 Probando pedidos con columnas básicas...');

  try {
    // 1. Verificar estructura de la tabla orders
    console.log('🔍 Verificando estructura de la tabla orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.error('❌ Error accediendo a la tabla orders:', ordersError);
      return;
    }

    if (orders && orders.length > 0) {
      console.log('✅ Estructura de la tabla orders:');
      console.log('Columnas disponibles:', Object.keys(orders[0]));
    } else {
      console.log('ℹ️  No hay pedidos en la tabla orders');
    }

    // 2. Buscar vendedores
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No hay vendedores en la base de datos');
      return;
    }

    const seller = profiles[0];
    console.log('✅ Vendedor encontrado:', seller.name);

    // 3. Obtener pedidos del vendedor (solo columnas que existen)
    const { data: sellerOrders, error: sellerOrdersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_cents,
        payment_method,
        status,
        delivery_cents,
        created_at
      `)
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false });

    if (sellerOrdersError) {
      console.error('❌ Error obteniendo pedidos del vendedor:', sellerOrdersError);
      return;
    }

    console.log('✅ Pedidos del vendedor encontrados:', sellerOrders.length);

    if (sellerOrders.length > 0) {
      console.log('\n📦 Pedidos del vendedor:');
      sellerOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Pedido #${order.id.slice(-8)}`);
        console.log(`   Total: $${(order.total_cents / 100).toFixed(2)}`);
        console.log(`   Estado: ${order.status}`);
        console.log(`   Método de pago: ${order.payment_method}`);
        console.log(`   Fecha: ${new Date(order.created_at).toLocaleDateString()}`);
      });

      // 4. Obtener items de los pedidos
      const orderIds = sellerOrders.map(order => order.id);
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('❌ Error obteniendo items:', itemsError);
        return;
      }

      console.log('\n📋 Items de pedidos:');
      orderItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} - $${(item.price_cents / 100).toFixed(2)} x ${item.qty}`);
      });
    } else {
      console.log('ℹ️  No hay pedidos para este vendedor');
    }

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('🔗 Ahora puedes:');
    console.log('1. Ir a /dashboard/pedidos');
    console.log('2. Iniciar sesión como vendedor');
    console.log('3. Ver los pedidos en el dashboard');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

testBasicOrders();
