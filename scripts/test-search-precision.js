#!/usr/bin/env node

/**
 * Script para probar la precisión de la búsqueda
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSearchPrecision() {
  console.log('🔍 Probando precisión de búsqueda...\n');
  
  try {
    // 1. Verificar vendedores activos
    console.log('👥 Verificando vendedores activos...');
    const { data: activeSellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);

    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }

    console.log(`📊 Total vendedores: ${activeSellers?.length || 0}`);

    // 2. Verificar productos activos por vendedor
    console.log('\n📦 Verificando productos activos por vendedor...');
    const { data: allActiveProducts, error: allActiveError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        products!inner (
          id,
          title,
          description,
          category
        )
      `)
      .eq('active', true)
      .gt('stock', 0);

    if (allActiveError) {
      console.error('❌ Error obteniendo productos activos:', allActiveError);
      return;
    }

    console.log(`🟢 Total productos activos: ${allActiveProducts?.length || 0}`);

    // 3. Agrupar por vendedor
    const productsBySeller = allActiveProducts?.reduce((acc, product) => {
      const sellerId = product.seller_id;
      if (!acc[sellerId]) {
        acc[sellerId] = [];
      }
      acc[sellerId].push(product);
      return acc;
    }, {}) || {};

    console.log('\n📋 PRODUCTOS ACTIVOS POR VENDEDOR:');
    Object.entries(productsBySeller).forEach(([sellerId, products]) => {
      const seller = activeSellers?.find(s => s.id === sellerId);
      console.log(`\n🏪 ${seller?.name || 'Vendedor desconocido'} (${sellerId}):`);
      console.log(`   📦 Productos activos: ${products.length}`);
      products.forEach(product => {
        console.log(`     - ${product.products.title} - Stock: ${product.stock} - $${Math.round(product.price_cents / 100)}`);
      });
    });

    // 4. Probar búsqueda de "aceite"
    console.log('\n🔍 Probando búsqueda de "aceite"...');
    const { data: aceiteProducts, error: aceiteError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        products!inner (
          id,
          title,
          description,
          category
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .ilike('products.title', '%aceite%');

    if (aceiteError) {
      console.error('❌ Error en búsqueda de aceite:', aceiteError);
    } else {
      console.log(`🔍 Productos de "aceite" encontrados: ${aceiteProducts?.length || 0}`);
      
      if (aceiteProducts && aceiteProducts.length > 0) {
        console.log('\n📋 PRODUCTOS DE "ACEITE" ENCONTRADOS:');
        aceiteProducts.forEach(product => {
          const seller = activeSellers?.find(s => s.id === product.seller_id);
          console.log(`  - ${product.products.title} (${seller?.name || 'Vendedor'}) - Stock: ${product.stock} - $${Math.round(product.price_cents / 100)}`);
        });
      }
    }

    // 5. Probar búsqueda de "cerveza"
    console.log('\n🔍 Probando búsqueda de "cerveza"...');
    const { data: cervezaProducts, error: cervezaError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        products!inner (
          id,
          title,
          description,
          category
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .ilike('products.title', '%cerveza%');

    if (cervezaError) {
      console.error('❌ Error en búsqueda de cerveza:', cervezaError);
    } else {
      console.log(`🔍 Productos de "cerveza" encontrados: ${cervezaProducts?.length || 0}`);
      
      if (cervezaProducts && cervezaProducts.length > 0) {
        console.log('\n📋 PRODUCTOS DE "CERVEZA" ENCONTRADOS:');
        cervezaProducts.forEach(product => {
          const seller = activeSellers?.find(s => s.id === product.seller_id);
          console.log(`  - ${product.products.title} (${seller?.name || 'Vendedor'}) - Stock: ${product.stock} - $${Math.round(product.price_cents / 100)}`);
        });
      }
    }

    // 6. Verificar estado online de vendedores
    console.log('\n🟢 Verificando estado online de vendedores...');
    const { data: sellerStatus, error: statusError } = await supabase
      .from('seller_status')
      .select('seller_id, online')
      .in('seller_id', Object.keys(productsBySeller));

    if (statusError) {
      console.error('❌ Error obteniendo estado de vendedores:', statusError);
    } else {
      console.log(`📊 Estados de vendedores: ${sellerStatus?.length || 0}`);
      
      if (sellerStatus && sellerStatus.length > 0) {
        sellerStatus.forEach(status => {
          const seller = activeSellers?.find(s => s.id === status.seller_id);
          console.log(`  - ${seller?.name || 'Vendedor'}: ${status.online ? '🟢 Online' : '🔴 Offline'}`);
        });
      }
    }

    // 7. Resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Vendedores activos: ${Object.keys(productsBySeller).length}`);
    console.log(`✅ Productos activos totales: ${allActiveProducts?.length || 0}`);
    console.log(`🔍 Búsqueda "aceite": ${aceiteProducts?.length || 0} productos`);
    console.log(`🔍 Búsqueda "cerveza": ${cervezaProducts?.length || 0} productos`);
    console.log(`🟢 Vendedores online: ${sellerStatus?.filter(s => s.online).length || 0}`);

    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - Solo Diego Ramírez y Minimarket La Esquina deben tener productos activos');
    console.log('   - Búsqueda de "aceite" debe mostrar solo productos de Diego Ramírez');
    console.log('   - Búsqueda de "cerveza" debe mostrar productos de Minimarket La Esquina');
    console.log('   - Diego Ramírez debe aparecer primero (vendedor online)');

    console.log('\n🚀 INSTRUCCIONES PARA PROBAR:');
    console.log('1. ✅ Verifica que solo 2 vendedores tengan productos activos');
    console.log('2. 🔍 Prueba la búsqueda de "aceite" en la aplicación');
    console.log('3. 🔍 Prueba la búsqueda de "cerveza" en la aplicación');
    console.log('4. 📱 Verifica que Diego Ramírez aparezca primero');
    console.log('5. 🎯 Verifica que la búsqueda sea precisa y no muestre productos incorrectos');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testSearchPrecision();



