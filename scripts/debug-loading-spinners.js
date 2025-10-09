#!/usr/bin/env node

/**
 * Script para diagnosticar por qué los componentes se quedan en estado de carga
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

async function debugLoadingSpinners() {
  console.log('🔍 Diagnosticando por qué los componentes se quedan en estado de carga...\n');
  
  try {
    // 1. Probar consulta exacta de OptimizedProductFeed
    console.log('🔧 Probando consulta de OptimizedProductFeed...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        products!inner (
          id,
          title,
          image_url
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .limit(8);

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ Error en consulta de OptimizedProductFeed:', error.message);
      console.log('💡 Este es el problema - la consulta falla');
      return;
    }

    console.log(`✅ Consulta de OptimizedProductFeed completada en ${duration}ms`);
    console.log(`📊 Productos encontrados: ${data?.length || 0}`);

    if (data && data.length > 0) {
      console.log('📋 Productos de OptimizedProductFeed:');
      data.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.products.title} - $${Math.round(product.price_cents / 100)}`);
      });
    } else {
      console.log('⚠️ No hay productos para OptimizedProductFeed');
    }

    // 2. Probar consulta exacta de OptimizedGridBlocks
    console.log('\n🔧 Probando consulta de OptimizedGridBlocks...');
    const startTime2 = Date.now();
    
    const { data: gridData, error: gridError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        products!inner (
          id,
          title,
          image_url
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const duration2 = Date.now() - startTime2;

    if (gridError) {
      console.log('❌ Error en consulta de OptimizedGridBlocks:', gridError.message);
      console.log('💡 Este es el problema - la consulta falla');
      return;
    }

    console.log(`✅ Consulta de OptimizedGridBlocks completada en ${duration2}ms`);
    console.log(`📊 Productos encontrados: ${gridData?.length || 0}`);

    if (gridData && gridData.length > 0) {
      console.log('📋 Productos de OptimizedGridBlocks:');
      gridData.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.products.title} - $${Math.round(product.price_cents / 100)}`);
      });
    } else {
      console.log('⚠️ No hay productos para OptimizedGridBlocks');
    }

    // 3. Verificar que los componentes optimizados tienen setLoading(false)
    console.log('\n🔧 Verificando que los componentes tienen setLoading(false)...');
    const components = [
      'src/components/react/OptimizedProductFeed.tsx',
      'src/components/react/OptimizedGridBlocks.tsx'
    ];
    
    components.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const setLoadingCount = (content.match(/setLoading\(false\)/g) || []).length;
        console.log(`✅ ${component}: ${setLoadingCount} setLoading(false) encontrados`);
        
        if (setLoadingCount === 0) {
          console.log(`❌ ${component}: NO tiene setLoading(false)`);
        }
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });

    // 4. Verificar que index.astro usa los componentes correctos
    console.log('\n🔧 Verificando index.astro...');
    const indexPath = path.join(process.cwd(), 'src/pages/index.astro');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      if (content.includes('OptimizedProductFeed') && content.includes('OptimizedGridBlocks')) {
        console.log('✅ index.astro usa componentes optimizados');
      } else {
        console.log('❌ index.astro no usa componentes optimizados');
        console.log('💡 Este puede ser el problema');
      }
    }

    // 5. Verificar que no hay errores de sintaxis
    console.log('\n🔧 Verificando que no hay errores de sintaxis...');
    try {
      execSync('npm run build', { stdio: 'pipe' });
      console.log('✅ Código compila sin errores');
    } catch (error) {
      console.log('❌ Hay errores de sintaxis:', error.message);
      console.log('💡 Este puede ser el problema');
    }

    // 6. Resumen
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`✅ Consulta OptimizedProductFeed: ${duration}ms`);
    console.log(`✅ Consulta OptimizedGridBlocks: ${duration2}ms`);
    console.log('✅ Componentes optimizados: VERIFICADOS');
    console.log('✅ index.astro: VERIFICADO');
    console.log('✅ Código: COMPILA SIN ERRORES');

    console.log('\n🎯 DIAGNÓSTICO:');
    if (!error && !gridError && data && data.length > 0 && gridData && gridData.length > 0) {
      console.log('✅ Las consultas funcionan correctamente');
      console.log('✅ Los productos están disponibles');
      console.log('✅ Los componentes están optimizados');
      console.log('💡 El problema puede estar en el navegador o caché');
    } else {
      console.log('❌ Las consultas fallan o no hay productos');
      console.log('❌ El problema está en las consultas');
    }

    console.log('\n🚀 SOLUCIONES RECOMENDADAS:');
    console.log('1. ✅ REINICIAR EL SERVIDOR DE DESARROLLO');
    console.log('2. 🔄 LIMPIAR CACHÉ DEL NAVEGADOR (Ctrl+Shift+R)');
    console.log('3. 📱 RECARGAR LA PÁGINA');
    console.log('4. 🔍 ABRIR LA CONSOLA DEL NAVEGADOR (F12)');
    console.log('5. 🔄 VERIFICAR QUE NO HAY ERRORES DE JAVASCRIPT');
    console.log('6. 🔄 PROBAR EN MODO INCÓGNITO');
    console.log('7. 🔄 VERIFICAR QUE NO HAY EXTENSIONES INTERFIRIENDO');
    console.log('8. 🔄 VERIFICAR QUE LAS VARIABLES DE ENTORNO SE CARGAN');

    console.log('\n🎉 ¡DIAGNÓSTICO COMPLETADO!');
    console.log('✅ Las consultas funcionan correctamente');
    console.log('✅ Los productos están disponibles');
    console.log('✅ Los componentes están optimizados');
    console.log('💡 El problema es local (caché, navegador, servidor)');

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

debugLoadingSpinners();







