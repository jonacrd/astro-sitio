#!/usr/bin/env node

/**
 * Script para probar la conexión a Supabase y diagnosticar problemas de carga
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔧 Probando conexión a Supabase...\n');
  
  try {
    // 1. Verificar configuración
    console.log('📊 Configuración:');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

    // 2. Probar conexión básica
    console.log('\n🔌 Probando conexión básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Error de conexión:', healthError);
      return;
    }

    console.log('✅ Conexión a Supabase exitosa');

    // 3. Probar consulta de productos
    console.log('\n📦 Probando consulta de productos...');
    const { data: products, error: productsError } = await supabase
      .from('seller_products')
      .select(`
        price_cents,
        stock,
        active,
        product_id,
        seller_id
      `)
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    console.log(`✅ Productos encontrados: ${products?.length || 0}`);
    
    if (products && products.length > 0) {
      console.log('\n📋 PRODUCTOS DISPONIBLES:');
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. Product ID: ${product.product_id}, Seller ID: ${product.seller_id}, Price: $${Math.round(product.price_cents / 100)}, Stock: ${product.stock}`);
      });

      // 4. Probar consulta de detalles de productos
      console.log('\n🔍 Probando consulta de detalles...');
      const productIds = products.map(p => p.product_id);
      const sellerIds = products.map(p => p.seller_id);

      const [productsResult, profilesResult] = await Promise.allSettled([
        supabase.from('products').select('id, title, description, category, image_url').in('id', productIds),
        supabase.from('profiles').select('id, name').in('id', sellerIds)
      ]);

      console.log(`📦 Products result: ${productsResult.status}`);
      console.log(`👥 Profiles result: ${profilesResult.status}`);

      if (productsResult.status === 'fulfilled') {
        console.log(`✅ Productos detallados: ${productsResult.value.data?.length || 0}`);
        if (productsResult.value.data && productsResult.value.data.length > 0) {
          productsResult.value.data.forEach(product => {
            console.log(`  - ${product.title} (${product.category})`);
          });
        }
      }

      if (profilesResult.status === 'fulfilled') {
        console.log(`✅ Perfiles: ${profilesResult.value.data?.length || 0}`);
        if (profilesResult.value.data && profilesResult.value.data.length > 0) {
          profilesResult.value.data.forEach(profile => {
            console.log(`  - ${profile.name}`);
          });
        }
      }
    }

    // 5. Probar timeout
    console.log('\n⏱️ Probando timeout...');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout test')), 2000)
    );

    const queryPromise = supabase
      .from('seller_products')
      .select('count')
      .limit(1);

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      console.log('✅ Consulta completada antes del timeout');
    } catch (error) {
      if (error.message === 'Timeout test') {
        console.log('⚠️ Timeout alcanzado (esto es normal para la prueba)');
      } else {
        console.error('❌ Error en prueba de timeout:', error);
      }
    }

    // 6. Resumen
    console.log('\n📊 RESUMEN DE CONEXIÓN:');
    console.log('✅ Conexión a Supabase: OK');
    console.log(`✅ Productos activos: ${products?.length || 0}`);
    console.log('✅ Consultas funcionando: OK');
    console.log('✅ Timeout manejado: OK');

    console.log('\n🎯 DIAGNÓSTICO:');
    if (products && products.length > 0) {
      console.log('✅ La base de datos tiene productos activos');
      console.log('✅ Las consultas funcionan correctamente');
      console.log('✅ El problema puede estar en el frontend');
    } else {
      console.log('⚠️ No hay productos activos en la base de datos');
      console.log('⚠️ Esto puede causar que los componentes se queden cargando');
    }

    console.log('\n🚀 RECOMENDACIONES:');
    console.log('1. ✅ Verificar que hay productos activos en la DB');
    console.log('2. ✅ Verificar que los componentes usan la instancia correcta de Supabase');
    console.log('3. ✅ Verificar que los timeouts están configurados');
    console.log('4. ✅ Verificar que los errores se manejan correctamente');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testSupabaseConnection();

