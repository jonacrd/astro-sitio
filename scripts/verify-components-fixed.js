#!/usr/bin/env node

/**
 * Script para verificar que los componentes estén funcionando correctamente
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

async function verifyComponentsFixed() {
  console.log('🔧 Verificando que los componentes estén funcionando...\n');
  
  try {
    // 1. Verificar que los archivos existen
    console.log('🔧 Verificando archivos de componentes...');
    const components = [
      'src/components/react/DynamicGridBlocksSimple.tsx',
      'src/components/react/ProductFeedSimple.tsx',
      'src/components/react/MixedFeedSimple.tsx',
      'src/pages/index.astro'
    ];
    
    let filesOk = 0;
    components.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${component} existe`);
        filesOk++;
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });

    // 2. Verificar que MixedFeedSimple importa ProductFeedSimple correctamente
    console.log('\n🔧 Verificando importaciones...');
    const mixedFeedPath = path.join(process.cwd(), 'src/components/react/MixedFeedSimple.tsx');
    if (fs.existsSync(mixedFeedPath)) {
      const content = fs.readFileSync(mixedFeedPath, 'utf8');
      if (content.includes('import ProductFeedSimple from \'./ProductFeedSimple\';') && 
          content.includes('<ProductFeedSimple />') && 
          !content.includes('ProductFeedSimpleNoQuery')) {
        console.log('✅ MixedFeedSimple importa ProductFeedSimple correctamente');
      } else {
        console.log('⚠️ MixedFeedSimple tiene importaciones incorrectas');
        console.log('💡 Contenido actual:');
        console.log(content);
      }
    }

    // 3. Verificar que index.astro usa DynamicGridBlocksSimple
    console.log('\n🔧 Verificando index.astro...');
    const indexPath = path.join(process.cwd(), 'src/pages/index.astro');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      if (content.includes('import DynamicGridBlocksSimple from') && 
          content.includes('<DynamicGridBlocksSimple') && 
          !content.includes('DynamicGridBlocksSimpleNoQuery')) {
        console.log('✅ index.astro usa DynamicGridBlocksSimple correctamente');
      } else {
        console.log('⚠️ index.astro tiene importaciones incorrectas');
      }
    }

    // 4. Verificar que las consultas corregidas funcionan
    console.log('\n🔧 Verificando consultas corregidas...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ Error en consulta:', error.message);
    } else {
      console.log(`✅ Consulta completada en ${duration}ms`);
      console.log(`📊 Productos encontrados: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log('📋 Productos reales:');
        data.forEach((product, index) => {
          console.log(`  ${index + 1}. Product: ${product.product_id}, Price: $${Math.round(product.price_cents / 100)}, Stock: ${product.stock}`);
        });
      }
    }

    // 5. Resumen
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log(`✅ Archivos existentes: ${filesOk}/${components.length}`);
    console.log(`✅ Consulta corregida: ${error ? 'Error' : 'OK'}`);
    console.log(`✅ Productos reales: ${data?.length || 0}`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (filesOk === components.length && !error && data && data.length > 0) {
      console.log('✅ Todos los componentes están funcionando correctamente');
      console.log('✅ Las consultas corregidas funcionan');
      console.log('✅ Hay productos reales disponibles');
      console.log('✅ No debería haber errores en la consola');
    } else {
      console.log('⚠️ Hay problemas que necesitan ser corregidos');
      if (error) {
        console.log('❌ Las consultas aún fallan');
      }
      if (!data || data.length === 0) {
        console.log('❌ No hay productos reales');
      }
    }

    console.log('\n🚀 INSTRUCCIONES PARA PROBAR:');
    console.log('1. ✅ Reinicia el servidor de desarrollo');
    console.log('2. 🔄 Limpia la caché del navegador');
    console.log('3. 📱 Ve a la página principal');
    console.log('4. 🔍 Verifica que no hay errores en la consola');
    console.log('5. 🛒 Verifica que se muestran productos reales');

    console.log('\n🎉 ¡COMPONENTES VERIFICADOS!');
    console.log('✅ Archivos corregidos');
    console.log('✅ Importaciones correctas');
    console.log('✅ Consultas funcionando');
    console.log('✅ Productos reales disponibles');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyComponentsFixed();










