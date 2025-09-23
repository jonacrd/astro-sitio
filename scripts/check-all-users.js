#!/usr/bin/env node

/**
 * Script para verificar todos los usuarios y vendedores del sistema
 * Ejecutar con: node scripts/check-all-users.js
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

async function checkAllUsers() {
  console.log('👥 Verificando todos los usuarios del sistema...');

  try {
    // 1. Obtener todos los usuarios
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    console.log(`✅ Total de usuarios en el sistema: ${users.users.length}`);

    // 2. Obtener todos los perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, phone, is_seller, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError);
      return;
    }

    console.log(`✅ Total de perfiles: ${profiles.length}`);

    // 3. Separar vendedores y compradores
    const sellers = profiles.filter(p => p.is_seller === true);
    const buyers = profiles.filter(p => p.is_seller === false || p.is_seller === null);

    console.log(`\n📊 Distribución de usuarios:`);
    console.log(`   Vendedores: ${sellers.length}`);
    console.log(`   Compradores: ${buyers.length}`);

    // 4. Mostrar vendedores
    if (sellers.length > 0) {
      console.log('\n🏪 VENDEDORES:');
      sellers.forEach((seller, index) => {
        console.log(`   ${index + 1}. ${seller.name || 'Sin nombre'} (${seller.id.slice(-8)})`);
        console.log(`      Teléfono: ${seller.phone || 'No especificado'}`);
        console.log(`      Registrado: ${new Date(seller.created_at).toLocaleDateString()}`);
      });
    }

    // 5. Mostrar compradores
    if (buyers.length > 0) {
      console.log('\n🛒 COMPRADORES:');
      buyers.forEach((buyer, index) => {
        console.log(`   ${index + 1}. ${buyer.name || 'Sin nombre'} (${buyer.id.slice(-8)})`);
        console.log(`      Teléfono: ${buyer.phone || 'No especificado'}`);
        console.log(`      Registrado: ${new Date(buyer.created_at).toLocaleDateString()}`);
      });
    }

    // 6. Verificar pedidos por vendedor
    if (sellers.length > 0) {
      console.log('\n📦 PEDIDOS POR VENDEDOR:');
      for (const seller of sellers) {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, total_cents, status, created_at')
          .eq('seller_id', seller.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.log(`   ❌ Error obteniendo pedidos de ${seller.name}:`, ordersError.message);
          continue;
        }

        console.log(`   🏪 ${seller.name}:`);
        console.log(`      Total de pedidos: ${orders.length}`);
        
        if (orders.length > 0) {
          const totalEarnings = orders.reduce((sum, order) => sum + order.total_cents, 0);
          console.log(`      Ganancias totales: $${(totalEarnings / 100).toFixed(2)}`);
          
          const pendingOrders = orders.filter(order => order.status === 'pending');
          console.log(`      Pedidos pendientes: ${pendingOrders.length}`);
          
          if (pendingOrders.length > 0) {
            console.log(`      Último pedido: ${new Date(orders[0].created_at).toLocaleDateString()}`);
          }
        }
      }
    }

    // 7. Verificar carritos por comprador
    if (buyers.length > 0) {
      console.log('\n🛒 CARRITOS POR COMPRADOR:');
      for (const buyer of buyers) {
        const { data: carts, error: cartsError } = await supabase
          .from('carts')
          .select('id, seller_id, created_at')
          .eq('user_id', buyer.id);

        if (cartsError) {
          console.log(`   ❌ Error obteniendo carritos de ${buyer.name}:`, cartsError.message);
          continue;
        }

        console.log(`   🛒 ${buyer.name}:`);
        console.log(`      Carritos activos: ${carts.length}`);
        
        if (carts.length > 0) {
          // Obtener items de cada carrito
          for (const cart of carts) {
            const { data: items, error: itemsError } = await supabase
              .from('cart_items')
              .select('title, price_cents, qty')
              .eq('cart_id', cart.id);

            if (!itemsError && items.length > 0) {
              const cartTotal = items.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
              console.log(`         Carrito ${cart.id.slice(-8)}: $${(cartTotal / 100).toFixed(2)} (${items.length} items)`);
            }
          }
        }
      }
    }

    // 8. Verificar productos disponibles
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(10);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    console.log(`\n📦 PRODUCTOS DISPONIBLES: ${products.length} productos`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.title} (${product.category})`);
    });

    // 9. Verificar productos de vendedores
    const { data: sellerProducts, error: sellerProductsError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        seller:profiles!carts_seller_id_fkey(
          name
        ),
        product:products!inner(
          title
        )
      `)
      .eq('active', true)
      .gt('stock', 0);

    if (sellerProductsError) {
      console.error('❌ Error obteniendo productos de vendedores:', sellerProductsError);
      return;
    }

    console.log(`\n🏪 PRODUCTOS DE VENDEDORES: ${sellerProducts.length} productos activos`);
    sellerProducts.forEach((sp, index) => {
      console.log(`   ${index + 1}. ${sp.product.title} - ${sp.seller.name} - $${(sp.price_cents / 100).toFixed(2)} (Stock: ${sp.stock})`);
    });

    console.log('\n🎉 ¡Verificación completada!');
    console.log('\n🔗 Para probar el sistema:');
    console.log('1. Todos los vendedores pueden acceder a /dashboard/pedidos');
    console.log('2. Todos los compradores pueden agregar productos al carrito');
    console.log('3. Todos los usuarios pueden acceder a /perfil');
    console.log('4. El sistema es universal para todos los usuarios registrados');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

checkAllUsers();
