#!/usr/bin/env node

/**
 * Script para probar la API del carrito directamente
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCartAPI() {
  try {
    console.log('🧪 Probando API del carrito...');
    
    // Obtener un usuario que tenga carritos
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', '29197e62-fef7-4ba8-808a-4dfb48aea7f5'); // Usuario que tiene carritos
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ No hay usuarios para probar');
      return;
    }
    
    const testUser = users[0];
    console.log(`👤 Probando con usuario: ${testUser.name} (${testUser.id})`);
    
    // Crear un token de prueba (esto es solo para testing)
    const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'test@example.com',
      options: {
        redirectTo: 'http://localhost:4321'
      }
    });
    
    if (sessionError) {
      console.error('❌ Error creando sesión de prueba:', sessionError);
      return;
    }
    
    console.log('🔑 Token de sesión creado');
    
    // Simular la lógica de la API
    console.log('\n📊 Simulando lógica de /api/cart/items...');
    
    // 1. Obtener carritos del usuario
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select(`
        id,
        seller_id
      `)
      .eq('user_id', testUser.id);
    
    if (cartsError) {
      console.error('❌ Error obteniendo carritos:', cartsError);
      return;
    }
    
    console.log(`📦 Carritos encontrados: ${carts?.length || 0}`);
    
    if (!carts || carts.length === 0) {
      console.log('❌ No hay carritos para este usuario');
      return;
    }
    
    // 2. Obtener items de carrito
    const cartIds = carts.map(cart => cart.id);
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        title,
        price_cents,
        qty
      `)
      .in('cart_id', cartIds);
    
    if (itemsError) {
      console.error('❌ Error obteniendo items:', itemsError);
      return;
    }
    
    console.log(`🛒 Items encontrados: ${cartItems?.length || 0}`);
    
    // 3. Obtener vendedores
    const sellerIds = [...new Set(carts.map(cart => cart.seller_id))];
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', sellerIds);
    
    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }
    
    // 4. Formatear datos
    const sellerMap = sellers?.reduce((acc, seller) => {
      acc[seller.id] = seller.name;
      return acc;
    }, {}) || {};
    
    const formattedItems = cartItems?.map(item => {
      const cart = carts.find(c => c.id === item.cart_id);
      return {
        id: item.id,
        cartId: item.cart_id,
        productId: item.product_id,
        title: item.title,
        priceCents: item.price_cents,
        qty: item.qty,
        sellerId: cart?.seller_id || '',
        sellerName: cart?.seller_id ? sellerMap[cart.seller_id] || 'Vendedor' : 'Vendedor',
        totalCents: item.price_cents * item.qty
      };
    }) || [];
    
    const totalCents = formattedItems.reduce((sum, item) => sum + item.totalCents, 0);
    const itemCount = formattedItems.reduce((sum, item) => sum + item.qty, 0);
    
    console.log('\n✅ Resultado de la API:');
    console.log(`   Items: ${itemCount}`);
    console.log(`   Total: $${(totalCents / 100).toFixed(2)}`);
    console.log('\n📋 Productos:');
    formattedItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.sellerName})`);
      console.log(`      Cantidad: ${item.qty} × $${(item.priceCents / 100).toFixed(2)} = $${(item.totalCents / 100).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testCartAPI().catch(console.error);
