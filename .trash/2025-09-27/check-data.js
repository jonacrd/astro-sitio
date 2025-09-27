#!/usr/bin/env node

/**
 * Script para verificar datos en la base de datos
 * Ejecutar con: node scripts/check-data.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  try {
    console.log('🔍 Verificando datos en la base de datos...');

    // 1. Verificar productos
    console.log('\n📦 Productos:');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
    } else {
      console.log(`✅ Productos encontrados: ${products?.length || 0}`);
      products?.forEach(p => console.log(`  - ${p.title} (${p.category})`));
    }

    // 2. Verificar perfiles
    console.log('\n👥 Perfiles:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError);
    } else {
      console.log(`✅ Perfiles encontrados: ${profiles?.length || 0}`);
      profiles?.forEach(p => console.log(`  - ${p.name} (vendedor: ${p.is_seller})`));
    }

    // 3. Verificar seller_products
    console.log('\n📦 Productos por vendedor:');
    const { data: sellerProducts, error: sellerProductsError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products(title, category),
        seller:profiles(name)
      `)
      .limit(5);

    if (sellerProductsError) {
      console.error('❌ Error obteniendo productos por vendedor:', sellerProductsError);
    } else {
      console.log(`✅ Productos por vendedor encontrados: ${sellerProducts?.length || 0}`);
      sellerProducts?.forEach(sp => console.log(`  - ${sp.product?.title} por ${sp.seller?.name} - $${sp.price_cents/100} (stock: ${sp.stock})`));
    }

    // 4. Verificar seller_status
    console.log('\n🟢 Estados de vendedores:');
    const { data: statuses, error: statusesError } = await supabase
      .from('seller_status')
      .select(`
        seller_id,
        online,
        seller:profiles(name)
      `)
      .limit(5);

    if (statusesError) {
      console.error('❌ Error obteniendo estados:', statusesError);
    } else {
      console.log(`✅ Estados encontrados: ${statuses?.length || 0}`);
      statuses?.forEach(s => console.log(`  - ${s.seller?.name}: ${s.online ? 'Online' : 'Offline'}`));
    }

    // 5. Probar la consulta completa
    console.log('\n🔍 Probando consulta completa:');
    const { data: fullQuery, error: fullQueryError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        updated_at,
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

    if (fullQueryError) {
      console.error('❌ Error en consulta completa:', fullQueryError);
    } else {
      console.log(`✅ Consulta completa exitosa: ${fullQuery?.length || 0} productos`);
      fullQuery?.forEach(item => console.log(`  - ${item.product?.title} por ${item.seller?.name} - $${item.price_cents/100}`));
    }

  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  }
}

checkData().catch(console.error);



