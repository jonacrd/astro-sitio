#!/usr/bin/env node

/**
 * Script para verificar la estructura real de la tabla seller_products
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

async function checkSellerProductsStructure() {
  console.log('🔍 Verificando estructura de seller_products...\n');
  
  try {
    // 1. Intentar consulta sin especificar columnas
    console.log('🔧 Probando consulta sin especificar columnas...');
    const { data: allData, error: allError } = await supabase
      .from('seller_products')
      .select('*')
      .limit(1);

    if (allError) {
      console.log('❌ Error con select *:', allError.message);
    } else {
      console.log('✅ Consulta con select * funciona');
      console.log('📊 Datos encontrados:', allData?.length || 0);
      if (allData && allData.length > 0) {
        console.log('📋 Estructura de la tabla:');
        console.log(JSON.stringify(allData[0], null, 2));
      }
    }

    // 2. Intentar consulta con columnas específicas
    console.log('\n🔧 Probando consulta con columnas específicas...');
    const { data: specificData, error: specificError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .limit(1);

    if (specificError) {
      console.log('❌ Error con columnas específicas:', specificError.message);
    } else {
      console.log('✅ Consulta con columnas específicas funciona');
      console.log('📊 Datos encontrados:', specificData?.length || 0);
      if (specificData && specificData.length > 0) {
        console.log('📋 Datos específicos:');
        console.log(JSON.stringify(specificData[0], null, 2));
      }
    }

    // 3. Verificar si hay datos en la tabla
    console.log('\n🔧 Verificando si hay datos en la tabla...');
    const { data: countData, error: countError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error contando registros:', countError.message);
    } else {
      console.log('✅ Conteo de registros funciona');
      console.log(`📊 Total de registros: ${countData?.length || 0}`);
    }

    // 4. Intentar consulta con productos activos
    console.log('\n🔧 Probando consulta con productos activos...');
    const { data: activeData, error: activeError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .limit(5);

    if (activeError) {
      console.log('❌ Error con productos activos:', activeError.message);
    } else {
      console.log('✅ Consulta con productos activos funciona');
      console.log(`📊 Productos activos: ${activeData?.length || 0}`);
      if (activeData && activeData.length > 0) {
        console.log('📋 Productos activos:');
        activeData.forEach((product, index) => {
          console.log(`  ${index + 1}. Seller: ${product.seller_id}, Product: ${product.product_id}, Stock: ${product.stock}, Price: $${Math.round(product.price_cents / 100)}`);
        });
      }
    }

    // 5. Resumen
    console.log('\n📊 RESUMEN DE ESTRUCTURA:');
    console.log(`✅ Select *: ${allError ? 'Error' : 'OK'}`);
    console.log(`✅ Columnas específicas: ${specificError ? 'Error' : 'OK'}`);
    console.log(`✅ Conteo: ${countError ? 'Error' : 'OK'}`);
    console.log(`✅ Productos activos: ${activeError ? 'Error' : 'OK'}`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (specificError && specificError.message.includes('column seller_products.id does not exist')) {
      console.log('❌ La tabla seller_products no tiene columna id');
      console.log('💡 La tabla usa seller_id y product_id como clave compuesta');
      console.log('💡 Necesitamos actualizar las consultas para no usar id');
    } else if (activeData && activeData.length > 0) {
      console.log('✅ Hay productos activos disponibles');
      console.log('✅ Las consultas funcionan correctamente');
    } else {
      console.log('⚠️ No hay productos activos en la base de datos');
      console.log('💡 Necesitas agregar productos activos');
    }

    console.log('\n🚀 SOLUCIÓN:');
    console.log('1. ✅ Actualizar consultas para no usar columna id');
    console.log('2. ✅ Usar seller_id y product_id como identificadores');
    console.log('3. ✅ Verificar que hay productos activos');
    console.log('4. ✅ Probar las consultas corregidas');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

checkSellerProductsStructure();



