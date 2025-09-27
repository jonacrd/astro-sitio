#!/usr/bin/env node

/**
 * Script para probar el checkout con datos reales
 * Ejecutar con: node scripts/test-checkout.js
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

async function testCheckout() {
  console.log('🧪 Probando checkout con datos reales...');

  try {
    // 1. Buscar o crear usuario de prueba
    let user;
    try {
      const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail('comprador-test@example.com');
      if (existingUser.user) {
        user = existingUser;
        console.log('✅ Usuario existente encontrado:', user.user.email);
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: 'comprador-test@example.com',
        password: 'password123',
        email_confirm: true
      });

      if (userError) {
        console.error('Error creando usuario:', userError);
        return;
      }

      user = newUser;
      console.log('✅ Usuario creado:', user.user.email);
    }

    // 2. Crear o actualizar perfil del usuario
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.user.id,
        name: 'Comprador Test',
        phone: '1234567890',
        is_seller: false
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creando/actualizando perfil:', profileError);
      return;
    }

    console.log('✅ Perfil creado/actualizado');

    // 3. Buscar o crear vendedor de prueba
    let seller;
    try {
      const { data: existingSeller, error: getSellerError } = await supabase.auth.admin.getUserByEmail('vendedor-test@example.com');
      if (existingSeller.user) {
        seller = existingSeller;
        console.log('✅ Vendedor existente encontrado:', seller.user.email);
      } else {
        throw new Error('Seller not found');
      }
    } catch (error) {
      const { data: newSeller, error: sellerError } = await supabase.auth.admin.createUser({
        email: 'vendedor-test@example.com',
        password: 'password123',
        email_confirm: true
      });

      if (sellerError) {
        console.error('Error creando vendedor:', sellerError);
        return;
      }

      seller = newSeller;
      console.log('✅ Vendedor creado:', seller.user.email);
    }

    // 4. Crear o actualizar perfil del vendedor
    const { error: sellerProfileError } = await supabase
      .from('profiles')
      .upsert({
        id: seller.user.id,
        name: 'Diego TechStore',
        phone: '0987654321',
        is_seller: true
      }, { onConflict: 'id' });

    if (sellerProfileError) {
      console.error('Error creando/actualizando perfil del vendedor:', sellerProfileError);
      return;
    }

    console.log('✅ Perfil del vendedor creado/actualizado');

    // 5. Crear un producto de prueba
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title: 'iPhone 15 Pro',
        description: 'El último iPhone con todas las características',
        category: 'tecnologia',
        image_url: 'https://via.placeholder.com/300x300'
      })
      .select('id')
      .single();

    if (productError) {
      console.error('Error creando producto:', productError);
      return;
    }

    console.log('✅ Producto creado:', product.id);

    // 6. Agregar producto al vendedor
    const { error: sellerProductError } = await supabase
      .from('seller_products')
      .insert({
        seller_id: seller.user.id,
        product_id: product.id,
        price_cents: 150000, // $1500
        stock: 5,
        active: true
      });

    if (sellerProductError) {
      console.error('Error agregando producto al vendedor:', sellerProductError);
      return;
    }

    console.log('✅ Producto agregado al vendedor');

    // 7. Crear carrito
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .insert({
        user_id: user.user.id,
        seller_id: seller.user.id
      })
      .select('id')
      .single();

    if (cartError) {
      console.error('Error creando carrito:', cartError);
      return;
    }

    console.log('✅ Carrito creado:', cart.id);

    // 8. Agregar item al carrito
    const { error: cartItemError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id: product.id,
        title: 'iPhone 15 Pro',
        price_cents: 150000,
        qty: 1
      });

    if (cartItemError) {
      console.error('Error agregando item al carrito:', cartItemError);
      return;
    }

    console.log('✅ Item agregado al carrito');

    // 9. Crear orden de prueba
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.user.id,
        seller_id: seller.user.id,
        total_cents: 150000,
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

    // 10. Crear items de la orden
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        title: 'iPhone 15 Pro',
        price_cents: 150000,
        qty: 1
      });

    if (orderItemsError) {
      console.error('Error creando items de orden:', orderItemsError);
      return;
    }

    console.log('✅ Items de orden creados');

    console.log('\n🎉 ¡Datos de prueba creados exitosamente!');
    console.log('📧 Usuario comprador:', user.user.email);
    console.log('📧 Vendedor:', seller.user.email);
    console.log('🛒 Orden ID:', order.id);
    console.log('\n🔗 Ahora puedes:');
    console.log('1. Iniciar sesión como vendedor en /dashboard/pedidos');
    console.log('2. Ver el pedido pendiente');
    console.log('3. Confirmar y gestionar el pedido');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

testCheckout();