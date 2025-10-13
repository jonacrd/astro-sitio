#!/usr/bin/env node

/**
 * Script para diagnosticar el problema de carga infinita en el feed
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

async function diagnoseFeedLoading() {
  console.log('🔍 Diagnosticando problema de carga infinita en el feed...\n');
  
  try {
    // 1. Verificar el flujo de componentes
    console.log('🔧 Verificando flujo de componentes...');
    const components = [
      'src/pages/index.astro',
      'src/components/react/AuthWrapper.tsx',
      'src/components/react/MixedFeedSimple.tsx',
      'src/components/react/ProductFeedSimple.tsx'
    ];
    
    components.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${component} existe`);
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });

    // 2. Verificar que ProductFeedSimple tiene useCart
    console.log('\n🔧 Verificando que ProductFeedSimple tiene useCart...');
    const productFeedPath = path.join(process.cwd(), 'src/components/react/ProductFeedSimple.tsx');
    if (fs.existsSync(productFeedPath)) {
      const content = fs.readFileSync(productFeedPath, 'utf8');
      if (content.includes('useCart') && content.includes('addToCart')) {
        console.log('✅ ProductFeedSimple tiene useCart y addToCart');
      } else {
        console.log('❌ ProductFeedSimple no tiene useCart o addToCart');
      }
    }

    // 3. Probar la consulta exacta que usa ProductFeedSimple
    console.log('\n🔧 Probando consulta exacta de ProductFeedSimple...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .limit(20);

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ Error en consulta de ProductFeedSimple:', error.message);
    } else {
      console.log(`✅ Consulta de ProductFeedSimple completada en ${duration}ms`);
      console.log(`📊 Productos encontrados: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log('📋 Productos reales:');
        data.forEach((product, index) => {
          console.log(`  ${index + 1}. Product: ${product.product_id}, Price: $${Math.round(product.price_cents / 100)}, Stock: ${product.stock}`);
        });
      }
    }

    // 4. Probar consulta de productos
    console.log('\n🔧 Probando consulta de productos...');
    const startTime2 = Date.now();
    
    if (data && data.length > 0) {
      const productIds = data.map(item => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, description, category, image_url')
        .in('id', productIds);

      const duration2 = Date.now() - startTime2;

      if (productsError) {
        console.log('❌ Error en consulta de productos:', productsError.message);
      } else {
        console.log(`✅ Consulta de productos completada en ${duration2}ms`);
        console.log(`📊 Productos encontrados: ${productsData?.length || 0}`);
        
        if (productsData && productsData.length > 0) {
          console.log('📋 Productos con datos completos:');
          productsData.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.title} - ${product.category}`);
          });
        }
      }
    }

    // 5. Probar consulta de perfiles
    console.log('\n🔧 Probando consulta de perfiles...');
    const startTime3 = Date.now();
    
    if (data && data.length > 0) {
      const sellerIds = [...new Set(data.map(item => item.seller_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', sellerIds);

      const duration3 = Date.now() - startTime3;

      if (profilesError) {
        console.log('❌ Error en consulta de perfiles:', profilesError.message);
      } else {
        console.log(`✅ Consulta de perfiles completada en ${duration3}ms`);
        console.log(`📊 Perfiles encontrados: ${profilesData?.length || 0}`);
      }
    }

    // 6. Verificar que el componente tiene setLoading(false)
    console.log('\n🔧 Verificando que el componente tiene setLoading(false)...');
    if (fs.existsSync(productFeedPath)) {
      const content = fs.readFileSync(productFeedPath, 'utf8');
      if (content.includes('setLoading(false)')) {
        console.log('✅ ProductFeedSimple tiene setLoading(false)');
      } else {
        console.log('❌ ProductFeedSimple no tiene setLoading(false)');
      }
      
      if (content.includes('finally')) {
        console.log('✅ ProductFeedSimple tiene bloque finally');
      } else {
        console.log('❌ ProductFeedSimple no tiene bloque finally');
      }
    }

    // 7. Resumen
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`✅ Consulta de ProductFeedSimple: ${duration}ms`);
    console.log(`✅ Consulta de productos: ${duration2 || 'No probada'}ms`);
    console.log(`✅ Consulta de perfiles: ${duration3 || 'No probada'}ms`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (!error && data && data.length > 0) {
      console.log('✅ Las consultas funcionan correctamente');
      console.log('✅ El problema puede estar en el código del componente');
      console.log('💡 Verificar que setLoading(false) se ejecute');
    } else {
      console.log('❌ Las consultas fallan');
      console.log('❌ El problema está en las consultas');
    }

    console.log('\n🚀 SOLUCIONES RECOMENDADAS:');
    if (!error && data && data.length > 0) {
      console.log('1. ✅ Verificar que setLoading(false) se ejecute en todos los casos');
      console.log('2. ✅ Asegurar que el bloque finally se ejecute');
      console.log('3. ✅ Verificar que no hay errores en el código');
    } else {
      console.log('1. ✅ Arreglar las consultas');
      console.log('2. ✅ Verificar la conexión a Supabase');
      console.log('3. ✅ Revisar los filtros');
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

diagnoseFeedLoading();










