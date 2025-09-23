#!/usr/bin/env node

/**
 * Script para crear una orden de prueba
 * Ejecutar con: node scripts/create-test-order.js
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

async function createTestOrder() {
  console.log('🧪 Creando orden de prueba...');

  try {
    // 1. Buscar usuarios existentes
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError);
      return;
    }

    if (users.users.length === 0) {
      console.error('❌ No hay usuarios en la base de datos');
      return;
    }

    // Usar el primer usuario como comprador
    const buyer = users.users[0];
    console.log('✅ Usuario comprador:', buyer.email);

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
    console.log('✅ Vendedor:', seller.name);

    // 3. Buscar productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .limit(1);

    if (productsError || !products || products.length === 0) {
      console.error('❌ No hay productos en la base de datos');
      return;
    }

    const product = products[0];
    console.log('✅ Producto:', product.title);

    // 4. Crear orden de prueba
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: buyer.id,
        seller_id: seller.id,
        total_cents: 150000, // $1500
        payment_method: 'cash',
        status: 'pending',
        delivery_address: JSON.stringify({
          fullName: 'Juan Pérez',
          phone: '1234567890',
          address: 'Calle Principal 123',
          city: 'Santiago',
          state: 'Región Metropolitana',
          zipCode: '7500000',
          instructions: 'Llamar antes de llegar'
        }),
        delivery_name: 'Juan Pérez',
        delivery_phone: '1234567890',
        delivery_city: 'Santiago',
        delivery_state: 'Región Metropolitana',
        delivery_zip: '7500000'
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creando orden:', orderError);
      return;
    }

    console.log('✅ Orden creada:', order.id);

    // 5. Crear items de la orden
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        title: product.title,
        price_cents: 150000,
        qty: 1
      });

    if (orderItemsError) {
      console.error('Error creando items de orden:', orderItemsError);
      return;
    }

    console.log('✅ Items de orden creados');

    console.log('\n🎉 ¡Orden de prueba creada exitosamente!');
    console.log('📧 Comprador:', buyer.email);
    console.log('🏪 Vendedor:', seller.name);
    console.log('🛒 Orden ID:', order.id);
    console.log('📦 Producto:', product.title);
    console.log('\n🔗 Ahora puedes:');
    console.log('1. Iniciar sesión como vendedor en /dashboard/pedidos');
    console.log('2. Ver el pedido pendiente');
    console.log('3. Confirmar y gestionar el pedido');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

createTestOrder();
