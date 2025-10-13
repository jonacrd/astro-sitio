#!/usr/bin/env node

/**
 * Script para debuggear productos en la base de datos
 * Ejecutar con: node scripts/debug-products.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProducts() {
  try {
    console.log('🔍 Debuggeando productos en la base de datos...');
    
    // 1. Verificar productos base
    console.log('\n📦 Productos base:');
    const { data: baseProducts, error: bpError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(10);
    
    if (bpError) {
      console.error('❌ Error obteniendo productos base:', bpError);
    } else {
      console.log(`✅ Productos base encontrados: ${baseProducts?.length || 0}`);
      baseProducts?.forEach(product => {
        console.log(`   - ${product.title} (${product.category})`);
      });
    }
    
    // 2. Verificar vendedores
    console.log('\n👥 Vendedores:');
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);
    
    if (sError) {
      console.error('❌ Error obteniendo vendedores:', sError);
    } else {
      console.log(`✅ Vendedores encontrados: ${sellers?.length || 0}`);
      sellers?.forEach(seller => {
        console.log(`   - ${seller.name} (${seller.id})`);
      });
    }
    
    // 3. Verificar productos por vendedor
    console.log('\n📦 Productos por vendedor:');
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active');
    
    if (spError) {
      console.error('❌ Error obteniendo productos por vendedor:', spError);
    } else {
      console.log(`✅ Productos por vendedor encontrados: ${sellerProducts?.length || 0}`);
      sellerProducts?.forEach(item => {
        console.log(`   - Vendedor: ${item.seller_id}, Producto: ${item.product_id}, Precio: $${(item.price_cents / 100).toFixed(2)}, Stock: ${item.stock}, Activo: ${item.active}`);
      });
    }
    
    // 4. Verificar estados de vendedores
    console.log('\n🟢 Estados de vendedores:');
    const { data: status, error: stError } = await supabase
      .from('seller_status')
      .select('seller_id, online');
    
    if (stError) {
      console.error('❌ Error obteniendo estados:', stError);
    } else {
      console.log(`✅ Estados encontrados: ${status?.length || 0}`);
      status?.forEach(item => {
        console.log(`   - Vendedor: ${item.seller_id}, Online: ${item.online}`);
      });
    }
    
    // 5. Verificar query completa
    console.log('\n🔍 Query completa:');
    const { data: fullQuery, error: fqError } = await supabase
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
      .gt('stock', 0);
    
    if (fqError) {
      console.error('❌ Error en query completa:', fqError);
    } else {
      console.log(`✅ Query completa exitosa: ${fullQuery?.length || 0} productos`);
      fullQuery?.forEach(item => {
        console.log(`   - ${item.product.title} (${item.product.category}) - $${(item.price_cents / 100).toFixed(2)} - Stock: ${item.stock} - Vendedor: ${item.seller.name}`);
      });
    }
    
    return true;

  } catch (error) {
    console.error('❌ Error debuggeando productos:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Debuggeando productos en la base de datos...');
  
  const success = await debugProducts();
  if (!success) {
    console.log('❌ Error debuggeando productos');
    process.exit(1);
  }
  
  console.log('\n✅ Debug completado');
}

main().catch(console.error);














