#!/usr/bin/env node

/**
 * Script para diagnosticar problemas del carrito
 * Ejecutar con: node scripts/debug-cart.js
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

async function debugCart() {
  console.log('🔍 Diagnosticando problemas del carrito...');

  try {
    // 1. Verificar si las tablas de carrito existen
    console.log('\n1. Verificando tablas de carrito...');
    
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select('*')
      .limit(1);

    if (cartsError) {
      console.error('❌ Error accediendo a la tabla carts:', cartsError);
      console.log('💡 Solución: Ejecuta el script SQL para crear las tablas de carrito');
      return;
    }

    console.log('✅ Tabla carts existe');

    const { data: cartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('*')
      .limit(1);

    if (cartItemsError) {
      console.error('❌ Error accediendo a la tabla cart_items:', cartItemsError);
      console.log('💡 Solución: Ejecuta el script SQL para crear las tablas de carrito');
      return;
    }

    console.log('✅ Tabla cart_items existe');

    // 2. Buscar usuarios
    console.log('\n2. Buscando usuarios...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError);
      return;
    }

    if (users.users.length === 0) {
      console.error('❌ No hay usuarios en la base de datos');
      return;
    }

    const buyer = users.users[0];
    console.log('✅ Usuario encontrado:', buyer.email);

    // 3. Buscar vendedores
    console.log('\n3. Buscando vendedores...');
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

    // 4. Verificar carritos existentes
    console.log('\n4. Verificando carritos existentes...');
    const { data: existingCarts, error: existingCartsError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', buyer.id);

    if (existingCartsError) {
      console.error('❌ Error obteniendo carritos:', existingCartsError);
      return;
    }

    console.log(`✅ Carritos encontrados para ${buyer.email}:`, existingCarts.length);

    if (existingCarts.length > 0) {
      console.log('📦 Carritos existentes:');
      existingCarts.forEach((cart, index) => {
        console.log(`   ${index + 1}. Cart ID: ${cart.id}, Seller: ${cart.seller_id}`);
      });

      // 5. Verificar items de carrito
      console.log('\n5. Verificando items de carrito...');
      for (const cart of existingCarts) {
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cart.id);

        if (itemsError) {
          console.error('❌ Error obteniendo items del carrito:', itemsError);
          continue;
        }

        console.log(`📋 Items en carrito ${cart.id.slice(-8)}:`, items.length);
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title} - $${(item.price_cents / 100).toFixed(2)} x ${item.qty}`);
        });
      }
    } else {
      console.log('ℹ️  No hay carritos para este usuario');
      
      // 6. Crear carrito de prueba
      console.log('\n6. Creando carrito de prueba...');
      const { data: newCart, error: newCartError } = await supabase
        .from('carts')
        .insert({
          user_id: buyer.id,
          seller_id: seller.id
        })
        .select('id')
        .single();

      if (newCartError) {
        console.error('❌ Error creando carrito:', newCartError);
        return;
      }

      console.log('✅ Carrito creado:', newCart.id);

      // 7. Buscar productos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title')
        .limit(1);

      if (productsError || !products || products.length === 0) {
        console.error('❌ No hay productos en la base de datos');
        return;
      }

      const product = products[0];
      console.log('✅ Producto encontrado:', product.title);

      // 8. Agregar item al carrito
      const { error: addItemError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: newCart.id,
          product_id: product.id,
          title: product.title,
          price_cents: 35000, // $350
          qty: 1
        });

      if (addItemError) {
        console.error('❌ Error agregando item al carrito:', addItemError);
        return;
      }

      console.log('✅ Item agregado al carrito');
    }

    console.log('\n🎉 ¡Diagnóstico completado!');
    console.log('🔗 Ahora puedes:');
    console.log('1. Ir a /checkout');
    console.log('2. Completar el formulario');
    console.log('3. Procesar el checkout');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

debugCart();