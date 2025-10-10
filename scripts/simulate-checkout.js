#!/usr/bin/env node

/**
 * Script para simular checkout directamente en la base de datos
 * Ejecutar con: node scripts/simulate-checkout.js
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

async function simulateCheckout() {
  console.log('🛒 Simulando checkout directamente en la base de datos...');

  try {
    // 1. Buscar usuario y vendedor
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError || !users.users.length) {
      console.error('❌ No hay usuarios en la base de datos');
      return;
    }

    const buyer = users.users[0];
    console.log('✅ Usuario:', buyer.email);

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

    // 2. Buscar carrito del usuario
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', buyer.id)
      .eq('seller_id', seller.id)
      .single();

    if (cartError) {
      console.error('❌ Error obteniendo carrito:', cartError);
      return;
    }

    console.log('✅ Carrito encontrado:', cart.id.slice(-8));

    // 3. Obtener items del carrito
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('❌ Error obteniendo items del carrito:', itemsError);
      return;
    }

    if (cartItems.length === 0) {
      console.log('ℹ️  No hay items en el carrito');
      return;
    }

    console.log('✅ Items en carrito:', cartItems.length);
    cartItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} - $${(item.price_cents / 100).toFixed(2)} x ${item.qty}`);
    });

    // 4. Calcular total
    const totalCents = cartItems.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
    console.log('💰 Total calculado:', `$${(totalCents / 100).toFixed(2)}`);

    // 5. Crear orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: buyer.id,
        seller_id: seller.id,
        total_cents: totalCents,
        payment_method: 'cash',
        status: 'pending'
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('❌ Error creando orden:', orderError);
      return;
    }

    console.log('✅ Orden creada:', order.id.slice(-8));

    // 6. Crear items de la orden
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      title: item.title,
      price_cents: item.price_cents,
      qty: item.qty
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.error('❌ Error creando items de la orden:', orderItemsError);
      return;
    }

    console.log('✅ Items de la orden creados:', orderItems.length);

    // 7. Limpiar carrito
    const { error: deleteCartItemsError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteCartItemsError) {
      console.error('❌ Error limpiando items del carrito:', deleteCartItemsError);
      return;
    }

    const { error: deleteCartError } = await supabase
      .from('carts')
      .delete()
      .eq('id', cart.id);

    if (deleteCartError) {
      console.error('❌ Error eliminando carrito:', deleteCartError);
      return;
    }

    console.log('✅ Carrito limpiado');

    // 8. Verificar orden creada
    const { data: finalOrder, error: finalOrderError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        seller_id,
        total_cents,
        payment_method,
        status,
        created_at,
        buyer:profiles!orders_user_id_fkey(
          name
        )
      `)
      .eq('id', order.id)
      .single();

    if (finalOrderError) {
      console.error('❌ Error obteniendo orden final:', finalOrderError);
      return;
    }

    console.log('\n🎉 ¡Checkout simulado exitosamente!');
    console.log('📦 Detalles de la orden:');
    console.log(`   ID: ${finalOrder.id.slice(-8)}`);
    console.log(`   Comprador: ${finalOrder.buyer?.name || 'N/A'}`);
    console.log(`   Total: $${(finalOrder.total_cents / 100).toFixed(2)}`);
    console.log(`   Estado: ${finalOrder.status}`);
    console.log(`   Método de pago: ${finalOrder.payment_method}`);
    console.log(`   Fecha: ${new Date(finalOrder.created_at).toLocaleDateString()}`);

    console.log('\n🔗 Ahora puedes:');
    console.log('1. Ir a /dashboard/pedidos');
    console.log('2. Iniciar sesión como vendedor');
    console.log('3. Ver la orden pendiente');
    console.log('4. Confirmar y entregar la orden');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

simulateCheckout();












