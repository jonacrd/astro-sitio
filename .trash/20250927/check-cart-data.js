#!/usr/bin/env node

/**
 * Script para verificar los datos del carrito en la base de datos
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

async function checkCartData() {
  try {
    console.log('🔍 Verificando datos del carrito en la base de datos...');
    
    // 1. Verificar todos los carritos
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select(`
        id,
        user_id,
        seller_id,
        created_at
      `);
    
    if (cartsError) {
      console.error('❌ Error obteniendo carritos:', cartsError);
      return;
    }
    
    console.log(`\n📊 Carritos encontrados: ${carts?.length || 0}`);
    carts?.forEach((cart, index) => {
      console.log(`   ${index + 1}. Usuario ID: ${cart.user_id}`);
      console.log(`      Vendedor ID: ${cart.seller_id}`);
      console.log(`      Creado: ${cart.created_at}`);
    });
    
    // 2. Verificar items de carrito
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        title,
        price_cents,
        qty,
        created_at
      `);
    
    if (itemsError) {
      console.error('❌ Error obteniendo items del carrito:', itemsError);
      return;
    }
    
    console.log(`\n🛒 Items de carrito encontrados: ${cartItems?.length || 0}`);
    cartItems?.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title}`);
      console.log(`      Cart ID: ${item.cart_id}`);
      console.log(`      Precio: $${(item.price_cents / 100).toFixed(2)}`);
      console.log(`      Cantidad: ${item.qty}`);
      console.log(`      Total: $${((item.price_cents * item.qty) / 100).toFixed(2)}`);
    });
    
    // 3. Obtener información de usuarios
    const userIds = [...new Set(carts?.map(cart => cart.user_id) || [])];
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    console.log('\n👥 Usuarios con carritos:');
    users?.forEach(user => {
      const userCarts = carts?.filter(cart => cart.user_id === user.id) || [];
      const userItems = cartItems?.filter(item => 
        userCarts.some(cart => cart.id === item.cart_id)
      ) || [];
      
      const itemCount = userItems.reduce((sum, item) => sum + item.qty, 0);
      const totalCents = userItems.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
      
      console.log(`   👤 ${user.name} (${user.email})`);
      console.log(`      Carritos: ${userCarts.length}`);
      console.log(`      Items: ${itemCount}`);
      console.log(`      Total: $${(totalCents / 100).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando datos del carrito:', error);
  }
}

checkCartData().catch(console.error);
