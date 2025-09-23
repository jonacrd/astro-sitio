#!/usr/bin/env node

/**
 * Script para probar el endpoint de checkout
 * Ejecutar con: node scripts/test-checkout.js
 */

import { createClient } from '@supabase/supabase-js';

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

async function testCheckoutEndpoint() {
  try {
    console.log('🧪 Probando endpoint de checkout...');
    
    // 1. Crear usuario de prueba
    console.log('👤 Creando usuario de prueba...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123'
    });
    
    if (authError) {
      console.error('❌ Error creando usuario:', authError);
      return false;
    }
    
    if (!authData.user) {
      console.error('❌ No se pudo crear usuario');
      return false;
    }
    
    console.log('✅ Usuario creado:', authData.user.email);
    
    // 2. Obtener token de sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No hay sesión activa');
      return false;
    }
    
    console.log('✅ Token obtenido');
    
    // 3. Crear datos de prueba en la base de datos
    console.log('📦 Creando datos de prueba...');
    
    // Crear vendedor de prueba
    const { error: sellerError } = await supabase
      .from('profiles')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Vendedor Test',
        phone: '123456789',
        is_seller: true
      });
    
    if (sellerError) {
      console.error('❌ Error creando vendedor:', sellerError);
      return false;
    }
    
    // Crear producto de prueba
    const { error: productError } = await supabase
      .from('products')
      .upsert({
        id: 'test-product-1',
        title: 'Producto Test',
        category: 'test',
        image_url: 'https://example.com/image.jpg'
      });
    
    if (productError) {
      console.error('❌ Error creando producto:', productError);
      return false;
    }
    
    // Crear relación vendedor-producto
    const { error: sellerProductError } = await supabase
      .from('seller_products')
      .upsert({
        seller_id: '00000000-0000-0000-0000-000000000001',
        product_id: 'test-product-1',
        price_cents: 1000,
        stock: 10,
        active: true
      });
    
    if (sellerProductError) {
      console.error('❌ Error creando relación vendedor-producto:', sellerProductError);
      return false;
    }
    
    // Crear carrito de prueba
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .insert({
        user_id: authData.user.id,
        seller_id: '00000000-0000-0000-0000-000000000001'
      })
      .select('id')
      .single();
    
    if (cartError) {
      console.error('❌ Error creando carrito:', cartError);
      return false;
    }
    
    // Agregar item al carrito
    const { error: cartItemError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartData.id,
        product_id: 'test-product-1',
        title: 'Producto Test',
        price_cents: 1000,
        qty: 2
      });
    
    if (cartItemError) {
      console.error('❌ Error agregando item al carrito:', cartItemError);
      return false;
    }
    
    console.log('✅ Datos de prueba creados');
    
    // 4. Probar endpoint de checkout
    console.log('🛒 Probando checkout...');
    
    const response = await fetch('http://localhost:4321/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        sellerId: '00000000-0000-0000-0000-000000000001',
        payment_method: 'cash'
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error en checkout:', result);
      return false;
    }
    
    console.log('✅ Checkout exitoso:', result);
    
    // 5. Verificar que la orden se creó
    console.log('🔍 Verificando orden creada...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', authData.user.id);
    
    if (ordersError) {
      console.error('❌ Error verificando órdenes:', ordersError);
      return false;
    }
    
    console.log('📊 Órdenes encontradas:', orders?.length || 0);
    
    if (orders && orders.length > 0) {
      console.log('✅ Orden creada correctamente:', orders[0]);
    } else {
      console.error('❌ No se encontró la orden');
      return false;
    }
    
    // 6. Limpiar datos de prueba
    console.log('🧹 Limpiando datos de prueba...');
    
    await supabase.auth.signOut();
    
    console.log('✅ Prueba completada exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando prueba del endpoint de checkout...');
  
  const success = await testCheckoutEndpoint();
  
  if (success) {
    console.log('✅ Todas las pruebas pasaron');
  } else {
    console.log('❌ Algunas pruebas fallaron');
    process.exit(1);
  }
}

main().catch(console.error);
