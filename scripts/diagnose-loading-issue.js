#!/usr/bin/env node

/**
 * Script para diagnosticar el problema de carga infinita
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

async function diagnoseLoadingIssue() {
  console.log('🔍 Diagnosticando problema de carga infinita...\n');
  
  try {
    // 1. Probar la consulta exacta que usa el componente
    console.log('🔧 Probando consulta exacta del componente...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
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
          category,
          image_url
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ Error en consulta exacta:', error.message);
      console.log('💡 Este es el problema - la consulta falla');
      
      // Probar consulta alternativa
      console.log('\n🔧 Probando consulta alternativa...');
      const startTime2 = Date.now();
      
      const { data: altData, error: altError } = await supabase
        .from('seller_products')
        .select('seller_id, product_id, price_cents, stock, active')
        .eq('active', true)
        .gt('stock', 0)
        .limit(4);

      const duration2 = Date.now() - startTime2;

      if (altError) {
        console.log('❌ Error en consulta alternativa:', altError.message);
        console.log('❌ El problema es más profundo');
      } else {
        console.log(`✅ Consulta alternativa funciona en ${duration2}ms`);
        console.log(`📊 Productos encontrados: ${altData?.length || 0}`);
      }
    } else {
      console.log(`✅ Consulta exacta funciona en ${duration}ms`);
      console.log(`📊 Productos encontrados: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log('📋 Productos reales:');
        data.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.products.title} - $${Math.round(product.price_cents / 100)}`);
        });
      }
    }

    // 2. Verificar si el componente tiene problemas de sintaxis
    console.log('\n🔧 Verificando sintaxis del componente...');
    const componentPath = path.join(process.cwd(), 'src/components/react/DynamicGridBlocksSimple.tsx');
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Verificar problemas comunes
      const issues = [];
      
      if (content.includes('setLoading(true)') && !content.includes('setLoading(false)')) {
        issues.push('❌ setLoading(true) sin setLoading(false)');
      }
      
      if (content.includes('await supabase') && !content.includes('try')) {
        issues.push('❌ await supabase sin try-catch');
      }
      
      if (content.includes('Promise.race')) {
        issues.push('⚠️ Usa Promise.race que puede causar problemas');
      }
      
      if (issues.length > 0) {
        console.log('❌ Problemas encontrados en el componente:');
        issues.forEach(issue => console.log(`  ${issue}`));
      } else {
        console.log('✅ Sintaxis del componente parece correcta');
      }
    }

    // 3. Probar consulta de perfiles
    console.log('\n🔧 Probando consulta de perfiles...');
    const startTime3 = Date.now();
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(5);

    const duration3 = Date.now() - startTime3;

    if (profilesError) {
      console.log('❌ Error en consulta de perfiles:', profilesError.message);
    } else {
      console.log(`✅ Consulta de perfiles funciona en ${duration3}ms`);
      console.log(`📊 Perfiles encontrados: ${profilesData?.length || 0}`);
    }

    // 4. Resumen
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`✅ Consulta exacta: ${duration}ms`);
    console.log(`✅ Consulta alternativa: ${duration2 || 'No probada'}ms`);
    console.log(`✅ Consulta de perfiles: ${duration3}ms`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (error) {
      console.log('❌ El problema es la consulta con join');
      console.log('💡 La consulta products!inner está fallando');
      console.log('💡 Necesitamos usar consultas separadas');
    } else {
      console.log('✅ Las consultas funcionan');
      console.log('💡 El problema puede estar en el código del componente');
    }

    console.log('\n🚀 SOLUCIONES RECOMENDADAS:');
    if (error) {
      console.log('1. ✅ Usar consultas separadas en lugar de join');
      console.log('2. ✅ Simplificar la consulta');
      console.log('3. ✅ Agregar manejo de errores');
    } else {
      console.log('1. ✅ Verificar el código del componente');
      console.log('2. ✅ Asegurar que setLoading(false) se ejecute');
      console.log('3. ✅ Revisar el flujo de datos');
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

diagnoseLoadingIssue();








