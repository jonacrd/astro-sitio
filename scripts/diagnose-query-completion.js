#!/usr/bin/env node

/**
 * Script para diagnosticar por qué las consultas no se completan
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

async function diagnoseQueryCompletion() {
  console.log('🔍 Diagnosticando por qué las consultas no se completan...\n');
  
  try {
    // 1. Probar consulta básica sin filtros
    console.log('🔧 Probando consulta básica sin filtros...');
    const startTime1 = Date.now();
    
    const { data: basicData, error: basicError } = await supabase
      .from('seller_products')
      .select('*')
      .limit(1);

    const duration1 = Date.now() - startTime1;

    if (basicError) {
      console.log('❌ Error en consulta básica:', basicError.message);
      console.log('💡 Posibles causas:');
      console.log('   - Problemas de conexión a Supabase');
      console.log('   - RLS (Row Level Security) bloqueando acceso');
      console.log('   - Permisos insuficientes');
      return;
    } else {
      console.log(`✅ Consulta básica completada en ${duration1}ms`);
      console.log(`📊 Datos encontrados: ${basicData?.length || 0}`);
    }

    // 2. Probar consulta con filtros simples
    console.log('\n🔧 Probando consulta con filtros simples...');
    const startTime2 = Date.now();
    
    const { data: filterData, error: filterError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock')
      .limit(5);

    const duration2 = Date.now() - startTime2;

    if (filterError) {
      console.log('❌ Error en consulta con filtros:', filterError.message);
    } else {
      console.log(`✅ Consulta con filtros completada en ${duration2}ms`);
      console.log(`📊 Datos encontrados: ${filterData?.length || 0}`);
    }

    // 3. Probar consulta con filtros complejos
    console.log('\n🔧 Probando consulta con filtros complejos...');
    const startTime3 = Date.now();
    
    const { data: complexData, error: complexError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const duration3 = Date.now() - startTime3;

    if (complexError) {
      console.log('❌ Error en consulta compleja:', complexError.message);
    } else {
      console.log(`✅ Consulta compleja completada en ${duration3}ms`);
      console.log(`📊 Datos encontrados: ${complexData?.length || 0}`);
      
      if (complexData && complexData.length > 0) {
        console.log('📋 Productos activos:');
        complexData.forEach((product, index) => {
          console.log(`  ${index + 1}. Product: ${product.product_id}, Price: $${Math.round(product.price_cents / 100)}, Stock: ${product.stock}`);
        });
      }
    }

    // 4. Probar consulta con timeout
    console.log('\n🔧 Probando consulta con timeout...');
    const startTime4 = Date.now();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: La consulta tardó demasiado')), 5000)
    );

    const queryPromise = supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    try {
      const { data: timeoutData, error: timeoutError } = await Promise.race([queryPromise, timeoutPromise]);
      const duration4 = Date.now() - startTime4;

      if (timeoutError) {
        console.log('❌ Error en consulta con timeout:', timeoutError.message);
      } else {
        console.log(`✅ Consulta con timeout completada en ${duration4}ms`);
        console.log(`📊 Datos encontrados: ${timeoutData?.length || 0}`);
      }
    } catch (timeoutErr) {
      const duration4 = Date.now() - startTime4;
      console.log(`❌ Timeout alcanzado en ${duration4}ms:`, timeoutErr.message);
    }

    // 5. Probar consulta sin Promise.race
    console.log('\n🔧 Probando consulta sin Promise.race...');
    const startTime5 = Date.now();
    
    const { data: directData, error: directError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const duration5 = Date.now() - startTime5;

    if (directError) {
      console.log('❌ Error en consulta directa:', directError.message);
    } else {
      console.log(`✅ Consulta directa completada en ${duration5}ms`);
      console.log(`📊 Datos encontrados: ${directData?.length || 0}`);
    }

    // 6. Resumen
    console.log('\n📊 RESUMEN DE DIAGNÓSTICO:');
    console.log(`✅ Consulta básica: ${duration1}ms`);
    console.log(`✅ Consulta con filtros: ${duration2}ms`);
    console.log(`✅ Consulta compleja: ${duration3}ms`);
    console.log(`✅ Consulta con timeout: ${duration4 || 'Timeout'}ms`);
    console.log(`✅ Consulta directa: ${duration5}ms`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (basicError) {
      console.log('❌ Problema de conexión básica a Supabase');
      console.log('💡 Verificar URL y clave de Supabase');
    } else if (filterError) {
      console.log('❌ Problema con consultas con filtros');
      console.log('💡 Verificar estructura de la tabla');
    } else if (complexError) {
      console.log('❌ Problema con consultas complejas');
      console.log('💡 Verificar filtros eq() y gt()');
    } else if (duration4 && duration4 > 5000) {
      console.log('❌ Las consultas tardan más de 5 segundos');
      console.log('💡 Problema de rendimiento de Supabase');
    } else {
      console.log('✅ Las consultas funcionan correctamente');
      console.log('💡 El problema puede estar en el código de los componentes');
    }

    console.log('\n🚀 SOLUCIONES RECOMENDADAS:');
    if (basicError) {
      console.log('1. ✅ Verificar variables de entorno de Supabase');
      console.log('2. ✅ Verificar conexión a internet');
      console.log('3. ✅ Verificar URL de Supabase');
    } else if (complexError) {
      console.log('1. ✅ Simplificar las consultas');
      console.log('2. ✅ Usar consultas más básicas');
      console.log('3. ✅ Verificar filtros');
    } else {
      console.log('1. ✅ Las consultas funcionan, verificar código de componentes');
      console.log('2. ✅ Verificar que los componentes usan las consultas correctas');
      console.log('3. ✅ Verificar que no hay errores en el código');
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

diagnoseQueryCompletion();








