#!/usr/bin/env node

/**
 * Script para diagnosticar por qué las consultas a Supabase fallan
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

async function diagnoseSupabaseIssue() {
  console.log('🔍 Diagnosticando problema con Supabase...\n');
  
  try {
    // 1. Verificar conexión básica
    console.log('🔧 Verificando conexión básica...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Error de conexión:', testError.message);
      console.log('💡 Posibles causas:');
      console.log('   - URL de Supabase incorrecta');
      console.log('   - Clave anónima incorrecta');
      console.log('   - Problemas de red');
      console.log('   - RLS (Row Level Security) bloqueando acceso');
      return;
    } else {
      console.log('✅ Conexión básica funciona');
    }

    // 2. Verificar tabla seller_products
    console.log('\n🔧 Verificando tabla seller_products...');
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('id, product_id, seller_id, price_cents, stock, active')
      .limit(5);

    if (spError) {
      console.log('❌ Error en seller_products:', spError.message);
      console.log('💡 Posibles causas:');
      console.log('   - Tabla seller_products no existe');
      console.log('   - RLS bloqueando acceso');
      console.log('   - Permisos insuficientes');
    } else {
      console.log('✅ Tabla seller_products accesible');
      console.log(`📊 Productos encontrados: ${sellerProducts?.length || 0}`);
      if (sellerProducts && sellerProducts.length > 0) {
        console.log('📋 Primeros productos:');
        sellerProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ID: ${product.id}, Product: ${product.product_id}, Active: ${product.active}, Stock: ${product.stock}`);
        });
      }
    }

    // 3. Verificar productos activos
    console.log('\n🔧 Verificando productos activos...');
    const { data: activeProducts, error: activeError } = await supabase
      .from('seller_products')
      .select('id, product_id, seller_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .limit(5);

    if (activeError) {
      console.log('❌ Error obteniendo productos activos:', activeError.message);
    } else {
      console.log('✅ Productos activos accesibles');
      console.log(`📊 Productos activos: ${activeProducts?.length || 0}`);
      if (activeProducts && activeProducts.length > 0) {
        console.log('📋 Productos activos:');
        activeProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ID: ${product.id}, Product: ${product.product_id}, Stock: ${product.stock}, Price: $${Math.round(product.price_cents / 100)}`);
        });
      } else {
        console.log('⚠️ No hay productos activos en la base de datos');
        console.log('💡 Esto explica por qué no se muestran productos reales');
      }
    }

    // 4. Verificar tabla products
    console.log('\n🔧 Verificando tabla products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, description, category, image_url')
      .limit(5);

    if (productsError) {
      console.log('❌ Error en products:', productsError.message);
    } else {
      console.log('✅ Tabla products accesible');
      console.log(`📊 Productos en catálogo: ${products?.length || 0}`);
      if (products && products.length > 0) {
        console.log('📋 Primeros productos del catálogo:');
        products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.title} (${product.category})`);
        });
      }
    }

    // 5. Verificar tabla profiles
    console.log('\n🔧 Verificando tabla profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true)
      .limit(5);

    if (profilesError) {
      console.log('❌ Error en profiles:', profilesError.message);
    } else {
      console.log('✅ Tabla profiles accesible');
      console.log(`📊 Vendedores: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('📋 Vendedores:');
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. ${profile.name} (ID: ${profile.id})`);
        });
      }
    }

    // 6. Resumen del diagnóstico
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`✅ Conexión básica: ${testError ? 'Error' : 'OK'}`);
    console.log(`✅ Tabla seller_products: ${spError ? 'Error' : 'OK'}`);
    console.log(`✅ Productos activos: ${activeError ? 'Error' : 'OK'}`);
    console.log(`✅ Tabla products: ${productsError ? 'Error' : 'OK'}`);
    console.log(`✅ Tabla profiles: ${profilesError ? 'Error' : 'OK'}`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (activeProducts && activeProducts.length > 0) {
      console.log('✅ Hay productos activos disponibles');
      console.log('✅ Las consultas deberían funcionar');
      console.log('⚠️ El problema puede ser timeout o RLS');
    } else {
      console.log('❌ No hay productos activos en la base de datos');
      console.log('💡 Necesitas agregar productos activos a seller_products');
      console.log('💡 O activar productos existentes');
    }

    console.log('\n🚀 SOLUCIONES RECOMENDADAS:');
    if (activeProducts && activeProducts.length === 0) {
      console.log('1. ✅ Agregar productos activos a seller_products');
      console.log('2. ✅ Activar productos existentes');
      console.log('3. ✅ Verificar que los vendedores tengan productos');
    } else {
      console.log('1. ✅ Optimizar consultas para evitar timeouts');
      console.log('2. ✅ Verificar RLS y permisos');
      console.log('3. ✅ Usar consultas más simples');
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

diagnoseSupabaseIssue();










