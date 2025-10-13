#!/usr/bin/env node

/**
 * Script para verificar qué productos hay en la base de datos
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function checkDatabaseProducts() {
  console.log('🔍 Verificando productos en la base de datos...\n');
  
  try {
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno no configuradas');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Verificar productos base
    console.log('📦 PRODUCTOS BASE:');
    const { data: baseProducts, error: bpError } = await supabase
      .from('products')
      .select('id, title, category, image_url')
      .limit(10);
    
    if (bpError) {
      console.error('❌ Error obteniendo productos base:', bpError);
    } else {
      console.log(`✅ Productos base encontrados: ${baseProducts?.length || 0}`);
      baseProducts?.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} (${product.category})`);
      });
    }
    
    // 2. Verificar vendedores
    console.log('\n👥 VENDEDORES:');
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);
    
    if (sError) {
      console.error('❌ Error obteniendo vendedores:', sError);
    } else {
      console.log(`✅ Vendedores encontrados: ${sellers?.length || 0}`);
      sellers?.forEach((seller, index) => {
        console.log(`   ${index + 1}. ${seller.name} (${seller.id})`);
      });
    }
    
    // 3. Verificar productos por vendedor
    console.log('\n📦 PRODUCTOS POR VENDEDOR:');
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active');
    
    if (spError) {
      console.error('❌ Error obteniendo seller_products:', spError);
    } else {
      console.log(`✅ Seller products encontrados: ${sellerProducts?.length || 0}`);
      sellerProducts?.forEach((sp, index) => {
        console.log(`   ${index + 1}. Seller: ${sp.seller_id}, Product: ${sp.product_id}, Stock: ${sp.stock}, Active: ${sp.active}`);
      });
    }
    
    // 4. Verificar productos activos con stock
    console.log('\n🛍️ PRODUCTOS ACTIVOS CON STOCK:');
    const { data: activeProducts, error: apError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0);
    
    if (apError) {
      console.error('❌ Error obteniendo productos activos:', apError);
    } else {
      console.log(`✅ Productos activos con stock: ${activeProducts?.length || 0}`);
      activeProducts?.forEach((sp, index) => {
        console.log(`   ${index + 1}. Seller: ${sp.seller_id}, Product: ${sp.product_id}, Stock: ${sp.stock}`);
      });
    }
    
    // 5. Si no hay productos, crear algunos de ejemplo
    if ((!activeProducts || activeProducts.length === 0) && baseProducts && baseProducts.length > 0 && sellers && sellers.length > 0) {
      console.log('\n🔧 CREANDO PRODUCTOS DE EJEMPLO...');
      
      const firstSeller = sellers[0];
      const firstProduct = baseProducts[0];
      
      const { data: newSellerProduct, error: insertError } = await supabase
        .from('seller_products')
        .insert({
          seller_id: firstSeller.id,
          product_id: firstProduct.id,
          price_cents: 10000, // $100
          stock: 10,
          active: true
        })
        .select();
      
      if (insertError) {
        console.error('❌ Error creando producto de ejemplo:', insertError);
      } else {
        console.log('✅ Producto de ejemplo creado:', newSellerProduct);
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Productos base: ${baseProducts?.length || 0}`);
    console.log(`✅ Vendedores: ${sellers?.length || 0}`);
    console.log(`✅ Seller products: ${sellerProducts?.length || 0}`);
    console.log(`✅ Productos activos con stock: ${activeProducts?.length || 0}`);
    
    if (activeProducts && activeProducts.length > 0) {
      console.log('\n🎉 ¡HAY PRODUCTOS DISPONIBLES!');
      console.log('✅ La aplicación debería mostrar productos');
    } else {
      console.log('\n⚠️ NO HAY PRODUCTOS ACTIVOS CON STOCK');
      console.log('❌ La aplicación mostrará "No hay productos disponibles"');
      console.log('💡 Necesitas agregar productos a seller_products con active=true y stock>0');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseProducts();










