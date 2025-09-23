#!/usr/bin/env node

/**
 * Script para probar el endpoint de pedidos del vendedor
 * Ejecutar con: node scripts/test-seller-orders.js
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

async function testSellerOrders() {
  console.log('🧪 Probando endpoint de pedidos del vendedor...');

  try {
    // 1. Buscar vendedores
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

    // 2. Obtener pedidos del vendedor directamente desde Supabase
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_cents,
        payment_method,
        status,
        delivery_name,
        delivery_phone,
        delivery_city,
        delivery_state,
        delivery_zip,
        delivery_instructions,
        seller_confirmed_at,
        buyer_confirmed_at,
        created_at,
        updated_at,
        buyer:profiles!orders_user_id_fkey(
          name
        )
      `)
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
      return;
    }

    console.log('✅ Pedidos encontrados:', orders.length);

    if (orders.length > 0) {
      console.log('\n📦 Pedidos del vendedor:');
      orders.forEach((order, index) => {
        console.log(`\n${index + 1}. Pedido #${order.id.slice(-8)}`);
        console.log(`   Comprador: ${order.buyer?.name || 'N/A'}`);
        console.log(`   Total: $${(order.total_cents / 100).toFixed(2)}`);
        console.log(`   Estado: ${order.status}`);
        console.log(`   Fecha: ${new Date(order.created_at).toLocaleDateString()}`);
        if (order.delivery_name) {
          console.log(`   Dirección: ${order.delivery_name}, ${order.delivery_city}`);
        }
      });
    } else {
      console.log('ℹ️  No hay pedidos para este vendedor');
    }

    // 3. Obtener items de los pedidos
    if (orders.length > 0) {
      const orderIds = orders.map(order => order.id);
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

testSellerOrders();
