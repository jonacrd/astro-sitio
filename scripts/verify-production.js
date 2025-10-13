#!/usr/bin/env node

/**
 * Script para verificar el estado de producción
 * Ejecutar con: node scripts/verify-production.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyProduction() {
  console.log('🚀 Verificando estado de producción...');

  try {
    // 1. Verificar conexión a Supabase
    console.log('\n🔗 VERIFICANDO CONEXIÓN A SUPABASE:');
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        console.error('❌ Error conectando a Supabase:', error.message);
        return;
      }
      console.log('✅ Conexión a Supabase exitosa');
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      return;
    }

    // 2. Verificar productos
    console.log('\n📦 VERIFICANDO PRODUCTOS:');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(5);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
    } else {
      console.log(`✅ Productos en BD: ${products.length}`);
    }

    // 3. Verificar productos de vendedores
    console.log('\n🏪 VERIFICANDO PRODUCTOS DE VENDEDORES:');
    const { data: sellerProducts, error: sellerProductsError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          title,
          category
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .limit(5);

    if (sellerProductsError) {
      console.error('❌ Error obteniendo productos de vendedores:', sellerProductsError);
    } else {
      console.log(`✅ Productos de vendedores: ${sellerProducts.length}`);
    }

    // 4. Verificar endpoint local
    console.log('\n🌐 VERIFICANDO ENDPOINT LOCAL:');
    try {
      const response = await fetch('http://localhost:4321/api/feed/real?limit=4&offers=true');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint local funcionando');
        console.log(`   Productos encontrados: ${data.data?.products?.length || 0}`);
      } else {
        console.error(`❌ Error en endpoint local: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error probando endpoint local:', error.message);
    }

    // 5. Crear script de verificación para producción
    console.log('\n📝 CREANDO SCRIPT DE VERIFICACIÓN PARA PRODUCCIÓN:');
    
    const productionScript = `
// Script de verificación para producción
// Ejecutar en la consola del navegador en producción

console.log('🔍 Verificando producción...');

// 1. Verificar endpoint de debug
fetch('/api/debug/production')
  .then(response => response.json())
  .then(data => {
    console.log('🔧 Variables de entorno:', data.envVars);
    console.log('🌍 Entorno:', data.environment);
  })
  .catch(error => {
    console.error('❌ Error en debug endpoint:', error);
  });

// 2. Verificar endpoint /api/feed/real
const endpoints = [
  '/api/feed/real?limit=4&offers=true',
  '/api/feed/real?limit=6&featured=true',
  '/api/feed/real?limit=8&new=true',
  '/api/feed/real?limit=6&category=comida',
  '/api/feed/real?limit=4&category=bebidas'
];

endpoints.forEach(async (endpoint) => {
  try {
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      console.log(\`✅ \${endpoint}: \${data.data?.products?.length || 0} productos\`);
    } else {
      console.error(\`❌ \${endpoint}: \${response.status} \${response.statusText}\`);
    }
  } catch (error) {
    console.error(\`❌ \${endpoint}: \${error.message}\`);
  }
});
`;

    console.log('✅ Script de verificación creado');
    console.log('📋 Para usar en producción:');
    console.log('1. Abrir consola del navegador en producción');
    console.log('2. Pegar el script de verificación');
    console.log('3. Ejecutar para verificar endpoints');

    // 6. Resumen de soluciones
    console.log('\n🎯 SOLUCIONES PARA PRODUCCIÓN:');
    console.log('1. ✅ Verificar variables de entorno en Vercel');
    console.log('2. ✅ Verificar que las tablas existan en Supabase');
    console.log('3. ✅ Verificar que haya productos en la BD');
    console.log('4. ✅ Verificar que haya productos de vendedores activos');
    console.log('5. ✅ Verificar que el endpoint /api/feed/real esté funcionando');
    console.log('6. ✅ Verificar autenticación en producción');
    console.log('7. ✅ Verificar que no haya errores de CORS');
    console.log('8. ✅ Verificar que no haya errores de permisos');

    console.log('\n🔗 PASOS PARA SOLUCIONAR EN PRODUCCIÓN:');
    console.log('1. Ir a Vercel Dashboard');
    console.log('2. Verificar variables de entorno');
    console.log('3. Hacer redeploy si es necesario');
    console.log('4. Verificar logs de Vercel');
    console.log('5. Verificar logs de Supabase');

    console.log('\n💡 CAUSAS PROBABLES DE LOS ERRORES:');
    console.log('1. Variables de entorno no configuradas en Vercel');
    console.log('2. Endpoint /api/feed/real no desplegado correctamente');
    console.log('3. Problemas de autenticación en producción');
    console.log('4. Problemas de permisos en Supabase');
    console.log('5. Problemas de CORS en producción');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

verifyProduction();














