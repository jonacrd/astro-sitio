#!/usr/bin/env node

/**
 * Script para probar endpoints con datos reales
 * Ejecutar con: node scripts/test-endpoints.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFeedQuery() {
  try {
    console.log('🔍 Probando query del feed...');
    
    const { data: products, error } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          id,
          title,
          description,
          category,
          image_url
        ),
        seller:profiles!inner(
          id,
          name,
          phone
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .limit(5);

    if (error) {
      console.error('❌ Error en query del feed:', error);
      return false;
    }

    console.log(`✅ Query del feed exitosa: ${products?.length || 0} productos`);
    products?.forEach(product => {
      console.log(`   - ${product.product.title} (${product.product.category}) - $${(product.price_cents / 100).toFixed(2)} - Stock: ${product.stock}`);
    });

    return true;

  } catch (error) {
    console.error('❌ Error probando feed:', error);
    return false;
  }
}

async function testSearchQuery() {
  try {
    console.log('🔍 Probando query de búsqueda...');
    
    const { data: products, error } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          id,
          title,
          description,
          category,
          image_url
        ),
        seller:profiles!inner(
          id,
          name,
          phone
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .eq('product.category', 'comida')
      .limit(5);

    if (error) {
      console.error('❌ Error en query de búsqueda:', error);
      return false;
    }

    console.log(`✅ Query de búsqueda exitosa: ${products?.length || 0} productos`);
    products?.forEach(product => {
      console.log(`   - ${product.product.title} (${product.product.category}) - $${(product.price_cents / 100).toFixed(2)} - Stock: ${product.stock}`);
    });

    return true;

  } catch (error) {
    console.error('❌ Error probando búsqueda:', error);
    return false;
  }
}

async function testCartQuery() {
  try {
    console.log('🔍 Probando query del carrito...');
    
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        title,
        price_cents,
        qty
      `)
      .limit(5);

    if (error) {
      console.error('❌ Error en query del carrito:', error);
      return false;
    }

    console.log(`✅ Query del carrito exitosa: ${cartItems?.length || 0} items`);
    cartItems?.forEach(item => {
      console.log(`   - ${item.title} - $${(item.price_cents / 100).toFixed(2)} - Qty: ${item.qty}`);
    });

    return true;

  } catch (error) {
    console.error('❌ Error probando carrito:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Probando endpoints con datos reales...');
  
  // 1. Probar query del feed
  const feedSuccess = await testFeedQuery();
  if (!feedSuccess) {
    console.log('❌ Error en query del feed');
    process.exit(1);
  }
  
  // 2. Probar query de búsqueda
  const searchSuccess = await testSearchQuery();
  if (!searchSuccess) {
    console.log('❌ Error en query de búsqueda');
    process.exit(1);
  }
  
  // 3. Probar query del carrito
  const cartSuccess = await testCartQuery();
  if (!cartSuccess) {
    console.log('❌ Error en query del carrito');
    process.exit(1);
  }
  
  console.log('✅ Todas las queries funcionan correctamente');
  console.log('📋 Próximos pasos:');
  console.log('   1. Revisar logs del servidor para errores en endpoints');
  console.log('   2. Probar endpoints en el navegador');
  console.log('   3. Probar agregar al carrito');
  console.log('   4. Probar checkout');
}

main().catch(console.error);
