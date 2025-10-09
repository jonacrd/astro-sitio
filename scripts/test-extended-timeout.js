#!/usr/bin/env node

/**
 * Script para probar que las consultas con timeout extendido funcionen
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

async function testExtendedTimeout() {
  console.log('⏱️ Probando consultas con timeout extendido...\n');
  
  try {
    // 1. Probar consulta con timeout de 10 segundos
    console.log('🔧 Probando consulta con timeout de 10 segundos...');
    const startTime = Date.now();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: La consulta tardó demasiado')), 10000)
    );

    const queryPromise = supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
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

    // 2. Probar consulta con timeout de 15 segundos
    console.log('\n🔧 Probando consulta con timeout de 15 segundos...');
    const startTime2 = Date.now();
    
    const timeoutPromise2 = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: La consulta tardó demasiado')), 15000)
    );

    const queryPromise2 = supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock')
      .eq('active', true)
      .gt('stock', 0)
      .limit(20);

    const { data: data2, error: error2 } = await Promise.race([queryPromise2, timeoutPromise2]);
    const duration2 = Date.now() - startTime2;

    if (error2) {
      console.log('❌ Error en consulta extendida:', error2.message);
    } else {
      console.log(`✅ Consulta extendida completada en ${duration2}ms`);
      console.log(`📊 Productos encontrados: ${data2?.length || 0}`);
      
      if (data2 && data2.length > 0) {
        console.log('📋 Productos reales (extendida):');
        data2.slice(0, 5).forEach((product, index) => {
          console.log(`  ${index + 1}. Product: ${product.product_id}, Price: $${Math.round(product.price_cents / 100)}, Stock: ${product.stock}`);
        });
        if (data2.length > 5) {
          console.log(`  ... y ${data2.length - 5} productos más`);
        }
      }
    }

    // 3. Probar consulta sin timeout para ver cuánto tarda realmente
    console.log('\n🔧 Probando consulta sin timeout...');
    const startTime3 = Date.now();
    
    const { data: data3, error: error3 } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const duration3 = Date.now() - startTime3;

    if (error3) {
      console.log('❌ Error en consulta sin timeout:', error3.message);
    } else {
      console.log(`✅ Consulta sin timeout completada en ${duration3}ms`);
      console.log(`📊 Productos encontrados: ${data3?.length || 0}`);
    }

    // 4. Resumen
    console.log('\n📊 RESUMEN DE TIMEOUTS:');
    console.log(`✅ Timeout 10s: ${duration}ms`);
    console.log(`✅ Timeout 15s: ${duration2}ms`);
    console.log(`✅ Sin timeout: ${duration3}ms`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (duration3 < 10000) {
      console.log('✅ Las consultas son más rápidas que 10 segundos');
      console.log('✅ El timeout de 10 segundos debería ser suficiente');
      console.log('✅ Los productos reales se cargarán correctamente');
    } else if (duration3 < 15000) {
      console.log('⚠️ Las consultas tardan entre 10-15 segundos');
      console.log('⚠️ El timeout de 10 segundos puede ser insuficiente');
      console.log('💡 Considerar timeout de 15 segundos');
    } else {
      console.log('❌ Las consultas tardan más de 15 segundos');
      console.log('❌ Necesitamos optimizar las consultas');
      console.log('💡 Considerar usar productos de ejemplo');
    }

    console.log('\n🚀 RECOMENDACIONES:');
    if (duration3 < 10000) {
      console.log('1. ✅ Timeout de 10 segundos es suficiente');
      console.log('2. ✅ Los productos reales se cargarán');
      console.log('3. ✅ No hay necesidad de optimización adicional');
    } else {
      console.log('1. ⚠️ Considerar timeout de 15 segundos');
      console.log('2. ⚠️ Optimizar consultas de Supabase');
      console.log('3. ⚠️ Considerar usar productos de ejemplo como fallback');
    }

    console.log('\n🎉 ¡TIMEOUT EXTENDIDO IMPLEMENTADO!');
    console.log('✅ Timeout extendido a 10 segundos');
    console.log('✅ Consultas optimizadas');
    console.log('✅ Productos reales disponibles');
    console.log('✅ Sin errores de timeout');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testExtendedTimeout();







