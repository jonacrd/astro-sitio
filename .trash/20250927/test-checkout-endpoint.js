#!/usr/bin/env node

/**
 * Script para probar el endpoint de checkout corregido
 * Ejecutar con: node scripts/test-checkout-endpoint.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testCheckoutEndpoint() {
  console.log('🧪 Probando endpoint de checkout corregido...');

  try {
    // 1. Buscar usuario existente
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError || !users.users.length) {
      console.error('❌ No hay usuarios en la base de datos');
      return;
    }

    const buyer = users.users[0];
    console.log('✅ Usuario encontrado:', buyer.email);

    // 2. Buscar vendedor
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No hay vendedores en la base de datos');
      return;
    }

    const seller = profiles[0];
    console.log('✅ Vendedor encontrado:', seller.name);

    // 3. Crear carrito de prueba si no existe
    let { data: cart, error: cartError } = await supabaseAdmin
      .from('carts')
      .select('id')
      .eq('user_id', buyer.id)
      .eq('seller_id', seller.id)
      .single();

    if (cartError && cartError.code === 'PGRST116') {
      // Crear carrito
      const { data: newCart, error: createCartError } = await supabaseAdmin
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

    // 4. Buscar productos
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title')
      .limit(1);

    if (productsError || !products || products.length === 0) {
      console.error('❌ No hay productos en la base de datos');
      return;
    }

    const product = products[0];
    console.log('✅ Producto encontrado:', product.title);

    // 5. Agregar producto al carrito
    const { error: addItemError } = await supabaseAdmin
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

    // 6. Verificar carrito
    const { data: cartItems, error: itemsError } = await supabaseAdmin
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

    // 7. Probar checkout con autenticación real
    console.log('\n🧪 Probando checkout con autenticación real...');
    
    const checkoutData = {
      sellerId: seller.id,
      payment_method: 'cash',
      delivery_address: {
        fullName: 'Juan Pérez',
        phone: '1234567890',
        address: 'Calle Principal 123',
        city: 'Santiago',
        state: 'Región Metropolitana',
        zipCode: '7500000',
        instructions: 'Llamar antes de llegar'
      }
    };

    try {
      // Usar el token de acceso del usuario
      const response = await fetch('http://localhost:4321/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${buyer.access_token || 'test-token'}`
        },
        body: JSON.stringify(checkoutData)
      });

      const result = await response.json();
      console.log('📥 Respuesta del checkout:', result);

      if (result.success) {
        console.log('🎉 ¡Checkout exitoso!');
        console.log('   Orden ID:', result.orderId);
        console.log('   Total:', result.totalCents);
        console.log('   Puntos agregados:', result.pointsAdded);
      } else {
        console.log('❌ Error en checkout:', result.error);
      }

    } catch (error) {
      console.error('❌ Error en la petición:', error.message);
    }

    console.log('\n🎉 ¡Prueba completada!');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

testCheckoutEndpoint();



