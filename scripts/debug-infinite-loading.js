#!/usr/bin/env node

/**
 * Script para diagnosticar la carga infinita
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugInfiniteLoading() {
  console.log('🔍 Diagnosticando carga infinita...\n');
  
  try {
    // 1. Probar consulta exacta del componente
    console.log('🔧 Probando consulta exacta del componente...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .limit(20);

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ Error en consulta:', error.message);
      console.log('💡 Este es el problema - la consulta falla');
      return;
    }

    console.log(`✅ Consulta completada en ${duration}ms`);
    console.log(`📊 Productos encontrados: ${data?.length || 0}`);

    if (data && data.length > 0) {
      console.log('📋 Productos reales:');
      data.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. Product: ${product.product_id}, Price: $${Math.round(product.price_cents / 100)}, Stock: ${product.stock}`);
      });

      // 2. Probar consulta de productos
      console.log('\n🔧 Probando consulta de productos...');
      const startTime2 = Date.now();
      
      const productIds = data.map(item => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, description, category, image_url')
        .in('id', productIds);

      const duration2 = Date.now() - startTime2;

      if (productsError) {
        console.log('❌ Error en consulta de productos:', productsError.message);
        console.log('💡 Este es el problema - la consulta de productos falla');
        return;
      }

      console.log(`✅ Consulta de productos completada en ${duration2}ms`);
      console.log(`📊 Productos encontrados: ${productsData?.length || 0}`);

      // 3. Probar consulta de perfiles
      console.log('\n🔧 Probando consulta de perfiles...');
      const startTime3 = Date.now();
      
      const sellerIds = [...new Set(data.map(item => item.seller_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', sellerIds);

      const duration3 = Date.now() - startTime3;

      if (profilesError) {
        console.log('❌ Error en consulta de perfiles:', profilesError.message);
        console.log('💡 Este es el problema - la consulta de perfiles falla');
        return;
      }

      console.log(`✅ Consulta de perfiles completada en ${duration3}ms`);
      console.log(`📊 Perfiles encontrados: ${profilesData?.length || 0}`);

      // 4. Probar Promise.allSettled
      console.log('\n🔧 Probando Promise.allSettled...');
      const startTime4 = Date.now();
      
      const [productsResult, profilesResult] = await Promise.allSettled([
        supabase.from('products').select('id, title, description, category, image_url').in('id', productIds),
        supabase.from('profiles').select('id, name').in('id', sellerIds)
      ]);

      const duration4 = Date.now() - startTime4;

      console.log(`✅ Promise.allSettled completado en ${duration4}ms`);
      console.log(`📦 Products result: ${productsResult.status}`);
      console.log(`👥 Profiles result: ${profilesResult.status}`);

      const productsData2 = productsResult.status === 'fulfilled' ? productsResult.value.data : [];
      const profilesData2 = profilesResult.status === 'fulfilled' ? profilesResult.value.data : [];

      console.log(`📦 Products data: ${productsData2?.length || 0}`);
      console.log(`👥 Profiles data: ${profilesData2?.length || 0}`);

      // 5. Simular transformación de datos
      console.log('\n🔧 Simulando transformación de datos...');
      const productsMap = new Map(productsData2?.map(p => [p.id, p]) || []);
      const profilesMap = new Map(profilesData2?.map(p => [p.id, p]) || []);

      const transformedProducts = data.map((item, index) => {
        const product = productsMap.get(item.product_id);
        const profile = profilesMap.get(item.seller_id);
        
        return {
          id: `sp-${index}-${Date.now()}`,
          title: product?.title || 'Producto',
          description: product?.description || 'Descripción no disponible',
          category: product?.category || 'general',
          image_url: product?.image_url || 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80',
          price_cents: item.price_cents || 0,
          stock: item.stock || 0,
          seller_id: item.seller_id || '',
          seller_name: profile?.name || 'Vendedor',
          seller_avatar: '/default-avatar.png',
          created_at: new Date().toISOString(),
          is_featured: false,
          sales_count: 0
        };
      });

      console.log(`✅ Productos transformados: ${transformedProducts.length}`);
      console.log('📋 Productos finales:');
      transformedProducts.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title} - $${Math.round(product.price_cents / 100)} - ${product.seller_name}`);
      });

    } else {
      console.log('⚠️ No hay productos reales disponibles');
      console.log('💡 Se mostrarán productos de ejemplo');
    }

    // 6. Resumen
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`✅ Consulta principal: ${duration}ms`);
    console.log(`✅ Consulta de productos: ${duration2 || 'No probada'}ms`);
    console.log(`✅ Consulta de perfiles: ${duration3 || 'No probada'}ms`);
    console.log(`✅ Promise.allSettled: ${duration4 || 'No probado'}ms`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (!error && data && data.length > 0) {
      console.log('✅ Las consultas funcionan correctamente');
      console.log('✅ Los productos reales están disponibles');
      console.log('✅ La transformación de datos funciona');
      console.log('💡 El problema debe estar en el código del componente');
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
      console.log('4. ✅ Agregar console.log para debuggear');
    } else {
      console.log('1. ✅ Arreglar las consultas');
      console.log('2. ✅ Verificar la conexión a Supabase');
      console.log('3. ✅ Revisar los filtros');
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

debugInfiniteLoading();










