#!/usr/bin/env node

/**
 * Script para probar place_order manualmente
 * Ejecutar con: node scripts/test-place-order-manual.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPlaceOrderManual() {
  console.log('🧪 Probando place_order manualmente...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // IDs reales obtenidos del diagnóstico anterior
    const userId = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1
    const sellerId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore

    console.log(`\n📊 Probando con usuario: ${userId}`);
    console.log(`📊 Probando con vendedor: ${sellerId}`);

    // 1. Verificar que existe carrito
    console.log('\n📊 1. Verificando carrito...');
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('seller_id', sellerId);

    if (cartError) {
      console.error('❌ Error obteniendo carrito:', cartError);
    } else {
      console.log('✅ Carrito encontrado:', cart);
    }

    // 2. Si no hay carrito, crear uno de prueba
    if (!cart || cart.length === 0) {
      console.log('\n📊 2. Creando carrito de prueba...');
      
      // Crear carrito
      const { data: newCart, error: createCartError } = await supabase
        .from('carts')
        .insert({
          user_id: userId,
          seller_id: sellerId
        })
        .select()
        .single();

      if (createCartError) {
        console.error('❌ Error creando carrito:', createCartError);
      } else {
        console.log('✅ Carrito creado:', newCart);

        // Agregar item al carrito
        const { data: cartItem, error: itemError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: newCart.id,
            product_id: 'test-product',
            title: 'Producto de prueba',
            price_cents: 500000, // $5,000
            qty: 1
          })
          .select()
          .single();

        if (itemError) {
          console.error('❌ Error agregando item:', itemError);
        } else {
          console.log('✅ Item agregado:', cartItem);
        }
      }
    }

    // 3. Probar función place_order
    console.log('\n🧪 3. Probando función place_order...');
    const { data: orderResult, error: orderError } = await supabase.rpc('place_order', {
      user_id: userId,
      seller_id: sellerId,
      payment_method: 'cash'
    });

    if (orderError) {
      console.error('❌ Error en place_order:', orderError);
    } else {
      console.log('✅ Resultado de place_order:', orderResult);
    }

    // 4. Verificar si se crearon puntos
    console.log('\n📊 4. Verificando puntos creados...');
    const { data: points, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .eq('seller_id', sellerId);

    if (pointsError) {
      console.error('❌ Error obteniendo puntos:', pointsError);
    } else {
      console.log('✅ Puntos encontrados:', points);
    }

    // 5. Verificar historial de puntos
    console.log('\n📊 5. Verificando historial de puntos...');
    const { data: history, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId);

    if (historyError) {
      console.error('❌ Error obteniendo historial:', historyError);
    } else {
      console.log('✅ Historial encontrado:', history);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testPlaceOrderManual();
