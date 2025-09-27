#!/usr/bin/env node

/**
 * Script para probar el flujo completo de compra
 * Ejecutar con: node scripts/test-full-flow.js
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

async function testFullFlow() {
  console.log('🛒 Probando flujo completo de compra...');

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

    // 2. Buscar productos
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

    // 3. Crear carrito si no existe
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', buyer.id)
      .eq('seller_id', seller.id)
      .single();

    if (cartError && cartError.code === 'PGRST116') {
      // Crear carrito
      const { data: newCart, error: createCartError } = await supabase
        .from('carts')
        .insert({
          user_id: buyer.id,
          seller_id: seller.id
        })
        .select('id')
        .single();

      if (createCartError) {
        console.error('❌ Error creando carrito:', createCartError);
        return;
      }

      cart = newCart;
      console.log('✅ Carrito creado:', cart.id.slice(-8));
    } else if (cartError) {
      console.error('❌ Error obteniendo carrito:', cartError);
      return;
    } else {
      console.log('✅ Carrito existente:', cart.id.slice(-8));
    }

    // 4. Agregar producto al carrito
    const { error: addItemError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id: product.id,
        title: product.title,
        price_cents: 35000, // $350
        qty: 1
      });

    if (addItemError) {
      console.error('❌ Error agregando item al carrito:', addItemError);
      return;
    }

    console.log('✅ Producto agregado al carrito');

    // 5. Verificar que el carrito tiene items
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('❌ Error obteniendo items del carrito:', itemsError);
      return;
    }

    console.log('✅ Items en carrito:', cartItems.length);
    cartItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} - $${(item.price_cents / 100).toFixed(2)} x ${item.qty}`);
    });

    // 6. Simular checkout usando la función RPC
    console.log('\n🧪 Simulando checkout usando función RPC...');
    
    try {
      const { data: orderResult, error: orderError } = await supabase.rpc('place_order', {
        user_id: buyer.id,
        seller_id: seller.id,
        payment_method: 'cash'
      });

      if (orderError) {
        console.error('❌ Error en place_order:', orderError);
        return;
      }

      console.log('🎉 ¡Checkout exitoso!');
      console.log('   Orden ID:', orderResult.order_id);
      console.log('   Total:', orderResult.total_cents);
      console.log('   Puntos agregados:', orderResult.points_added);

      // 7. Verificar que la orden se creó
      const { data: order, error: orderFetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderResult.order_id)
        .single();

      if (orderFetchError) {
        console.error('❌ Error obteniendo orden:', orderFetchError);
        return;
      }

      console.log('✅ Orden creada:', order.id.slice(-8));
      console.log('   Estado:', order.status);
      console.log('   Total:', `$${(order.total_cents / 100).toFixed(2)}`);

      // 8. Verificar items de la orden
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (orderItemsError) {
        console.error('❌ Error obteniendo items de la orden:', orderItemsError);
        return;
      }

      console.log('✅ Items de la orden:', orderItems.length);
      orderItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - $${(item.price_cents / 100).toFixed(2)} x ${item.qty}`);
      });

    } catch (error) {
      console.error('❌ Error en checkout:', error);
    }

    console.log('\n🎉 ¡Flujo completo probado exitosamente!');
    console.log('🔗 Ahora puedes:');
    console.log('1. Ir a /dashboard/pedidos');
    console.log('2. Ver la orden pendiente');
    console.log('3. Confirmar y entregar la orden');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

testFullFlow();
