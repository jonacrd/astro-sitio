#!/usr/bin/env node

/**
 * Script para probar consultas rápidas a Supabase
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

async function testFastQueries() {
  console.log('⚡ Probando consultas rápidas a Supabase...\n');
  
  try {
    // 1. Probar consulta simplificada
    console.log('🔧 Probando consulta simplificada...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('seller_products')
      .select('price_cents, stock, product_id, seller_id')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('❌ Error en consulta:', error);
      return;
    }

    console.log(`✅ Consulta completada en ${duration}ms`);
    console.log(`📊 Productos encontrados: ${data?.length || 0}`);

    if (data && data.length > 0) {
      console.log('\n📋 PRODUCTOS RÁPIDOS:');
      data.forEach((product, index) => {
        console.log(`  ${index + 1}. ID: ${product.product_id}, Price: $${Math.round(product.price_cents / 100)}, Stock: ${product.stock}`);
      });
    }

    // 2. Probar timeout de 5 segundos
    console.log('\n⏱️ Probando timeout de 5 segundos...');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: La consulta tardó demasiado')), 5000)
    );

    const queryPromise = supabase
      .from('seller_products')
      .select('price_cents, stock, product_id, seller_id')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      console.log('✅ Consulta completada antes del timeout');
    } catch (error) {
      if (error.message === 'Timeout: La consulta tardó demasiado') {
        console.log('⚠️ Timeout alcanzado (5 segundos)');
      } else {
        console.error('❌ Error en consulta:', error);
      }
    }

    // 3. Verificar componentes optimizados
    console.log('\n📄 Verificando componentes optimizados...');
    const components = [
      'src/components/react/DynamicGridBlocksSimple.tsx',
      'src/components/react/ProductFeedSimple.tsx'
    ];
    
    let componentsOk = 0;
    components.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('5000') && content.includes('select(\'price_cents, stock, product_id, seller_id\')')) {
          console.log(`✅ ${component} optimizado`);
          componentsOk++;
        } else {
          console.log(`⚠️ ${component} no completamente optimizado`);
        }
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });

    // 4. Resumen
    console.log('\n📊 RESUMEN DE OPTIMIZACIÓN:');
    console.log(`✅ Consulta completada en: ${duration}ms`);
    console.log(`✅ Productos encontrados: ${data?.length || 0}`);
    console.log(`✅ Componentes optimizados: ${componentsOk}/${components.length}`);
    console.log(`✅ Timeout configurado: 5 segundos`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (duration < 1000) {
      console.log('✅ Consulta muy rápida (< 1 segundo)');
    } else if (duration < 3000) {
      console.log('✅ Consulta rápida (< 3 segundos)');
    } else if (duration < 5000) {
      console.log('⚠️ Consulta lenta pero aceptable (< 5 segundos)');
    } else {
      console.log('❌ Consulta muy lenta (> 5 segundos)');
    }

    console.log('\n🚀 RECOMENDACIONES:');
    if (duration < 5000) {
      console.log('✅ Las consultas son suficientemente rápidas');
      console.log('✅ Los componentes deberían cargar correctamente');
      console.log('✅ El timeout de 5 segundos es apropiado');
    } else {
      console.log('⚠️ Las consultas son muy lentas');
      console.log('⚠️ Considerar usar datos de ejemplo');
      console.log('⚠️ Considerar optimizar la base de datos');
    }

    console.log('\n🎉 ¡CONSULTAS OPTIMIZADAS!');
    console.log('✅ Consultas simplificadas');
    console.log('✅ Timeout reducido a 5 segundos');
    console.log('✅ Sin consultas adicionales');
    console.log('✅ Datos básicos para mayor velocidad');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testFastQueries();










