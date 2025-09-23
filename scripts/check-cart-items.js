#!/usr/bin/env node

/**
 * Script para verificar items del carrito
 * Ejecutar con: node scripts/check-cart-items.js
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

async function checkCartItems() {
  console.log('🔍 Verificando items del carrito...');

  try {
    // 1. Buscar usuarios
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError);
      return;
    }

    const buyer = users.users[0];
    console.log('✅ Usuario:', buyer.email);

    // 2. Buscar carritos del usuario
    const { data: carts, error: cartsError } = await supabase
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

    console.log('✅ Carritos encontrados:', carts.length);

    if (carts.length === 0) {
      console.log('ℹ️  No hay carritos para este usuario');
      return;
    }

    // 3. Para cada carrito, mostrar items
    for (const cart of carts) {
      console.log(`\n📦 Carrito ${cart.id.slice(-8)}:`);
      console.log(`   Vendedor: ${cart.seller.name} (${cart.seller_id})`);

      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id);

      if (itemsError) {
        console.error('❌ Error obteniendo items:', itemsError);
        continue;
      }

      console.log(`   Items: ${items.length}`);
      items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - $${(item.price_cents / 100).toFixed(2)} x ${item.qty}`);
      });

      // 4. Simular checkout para este carrito
      console.log(`\n🧪 Simulando checkout para vendedor ${cart.seller_id}...`);
      
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

      console.log('📤 Datos de checkout:', JSON.stringify(checkoutData, null, 2));

      // 5. Probar endpoint de checkout
      try {
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
      } catch (error) {
        console.error('❌ Error en checkout:', error.message);
      }
    }

    console.log('\n🎉 ¡Verificación completada!');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

checkCartItems();
