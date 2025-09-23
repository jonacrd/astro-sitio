#!/usr/bin/env node

/**
 * Script para probar checkout con autenticación real
 * Ejecutar con: node scripts/test-checkout-real.js
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

async function testCheckoutReal() {
  console.log('🧪 Probando checkout con autenticación real...');

  try {
    // 1. Buscar usuario existente
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError || !users.users.length) {
      console.error('❌ No hay usuarios en la base de datos');
      return;
    }

    const buyer = users.users[0];
    console.log('✅ Usuario encontrado:', buyer.email);

    // 2. Buscar carritos del usuario
    const { data: carts, error: cartsError } = await supabaseAdmin
      .from('carts')
      .select(`
        id,
        user_id,
        seller_id,
        seller:profiles!carts_seller_id_fkey(
          id,
          name
        )
      `)
      .eq('user_id', buyer.id);

    if (cartsError) {
      console.error('❌ Error obteniendo carritos:', cartsError);
      return;
    }

    if (carts.length === 0) {
      console.log('ℹ️  No hay carritos para este usuario');
      return;
    }

    const cart = carts[0];
    console.log('✅ Carrito encontrado:', cart.id.slice(-8));
    console.log('   Vendedor:', cart.seller.name);

    // 3. Obtener items del carrito
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('❌ Error obteniendo items:', itemsError);
      return;
    }

    console.log('✅ Items en carrito:', items.length);
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} - $${(item.price_cents / 100).toFixed(2)} x ${item.qty}`);
    });

    // 4. Crear sesión de autenticación real
    console.log('\n🔐 Creando sesión de autenticación...');
    
    // Usar el token de acceso del usuario
    const { data: { session }, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: buyer.email,
      options: {
        redirectTo: 'http://localhost:4321'
      }
    });

    if (sessionError) {
      console.error('❌ Error creando sesión:', sessionError);
      return;
    }

    console.log('✅ Sesión creada');

    // 5. Probar checkout con autenticación real
    console.log('\n🧪 Probando checkout...');
    
    const checkoutData = {
      sellerId: cart.seller_id,
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
      // Usar el token de acceso del usuario directamente
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

testCheckoutReal();
