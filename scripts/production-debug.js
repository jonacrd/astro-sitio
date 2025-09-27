#!/usr/bin/env node

/**
 * Script para diagnosticar problemas específicos de producción
 * Ejecutar con: node scripts/production-debug.js
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

async function productionDebug() {
  console.log('🚀 Diagnosticando problemas específicos de producción...');

  try {
    // 1. Verificar errores específicos identificados
    console.log('\n🔍 ERRORES IDENTIFICADOS EN PRODUCCIÓN:');
    console.log('❌ AuthSessionMissingError: Auth session missing!');
    console.log('❌ HTTP 500 en /api/feed/real');
    console.log('❌ Error fetching products para diferentes secciones');
    console.log('❌ DynamicFeed.D46bIYEK.js:1:7398');

    // 2. Verificar endpoint /api/feed/real localmente
    console.log('\n🌐 VERIFICANDO ENDPOINT LOCAL:');
    
    const testEndpoints = [
      { url: '/api/feed/real?limit=4&offers=true', name: 'Ofertas' },
      { url: '/api/feed/real?limit=6&featured=true', name: 'Destacados' },
      { url: '/api/feed/real?limit=8&new=true', name: 'Nuevos' },
      { url: '/api/feed/real?limit=6&category=comida', name: 'Comida' },
      { url: '/api/feed/real?limit=4&category=bebidas', name: 'Bebidas' }
    ];

    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(`http://localhost:4321${endpoint.url}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name}: ${data.data?.products?.length || 0} productos`);
        } else {
          console.error(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ ${endpoint.name}: ${error.message}`);
      }
    }

    // 3. Verificar estructura del endpoint /api/feed/real
    console.log('\n📁 VERIFICANDO ESTRUCTURA DEL ENDPOINT:');
    
    const fs = require('fs');
    const path = require('path');
    
    const endpointPath = path.join(process.cwd(), 'src', 'pages', 'api', 'feed', 'real.ts');
    
    if (fs.existsSync(endpointPath)) {
      console.log('✅ Archivo /api/feed/real.ts existe');
      
      const content = fs.readFileSync(endpointPath, 'utf8');
      
      // Verificar elementos clave
      const hasSupabaseClient = content.includes('createClient');
      const hasServiceRoleKey = content.includes('SUPABASE_SERVICE_ROLE_KEY');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      const hasResponseFormat = content.includes('success: true');
      
      console.log(`   Supabase Client: ${hasSupabaseClient ? '✅' : '❌'}`);
      console.log(`   Service Role Key: ${hasServiceRoleKey ? '✅' : '❌'}`);
      console.log(`   Error Handling: ${hasErrorHandling ? '✅' : '❌'}`);
      console.log(`   Response Format: ${hasResponseFormat ? '✅' : '❌'}`);
    } else {
      console.error('❌ Archivo /api/feed/real.ts no existe');
    }

    // 4. Verificar variables de entorno
    console.log('\n🔧 VERIFICANDO VARIABLES DE ENTORNO:');
    
    const requiredEnvVars = [
      'PUBLIC_SUPABASE_URL',
      'PUBLIC_SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      console.log(`   ${envVar}: ${value ? '✅ Configurada' : '❌ Faltante'}`);
    });

    // 5. Verificar conexión a Supabase
    console.log('\n🔗 VERIFICANDO CONEXIÓN A SUPABASE:');
    
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        console.error('❌ Error conectando a Supabase:', error.message);
      } else {
        console.log('✅ Conexión a Supabase exitosa');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
    }

    // 6. Verificar productos en la base de datos
    console.log('\n📦 VERIFICANDO PRODUCTOS EN LA BD:');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(5);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
    } else {
      console.log(`✅ Productos en BD: ${products.length}`);
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} (${product.category})`);
      });
    }

    // 7. Verificar productos de vendedores
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
      sellerProducts.forEach((sp, index) => {
        console.log(`   ${index + 1}. ${sp.product.title} - $${(sp.price_cents / 100).toFixed(2)} (Stock: ${sp.stock})`);
      });
    }

    // 8. Crear script de verificación para producción
    console.log('\n📝 CREANDO SCRIPT DE VERIFICACIÓN PARA PRODUCCIÓN:');
    
    const productionScript = `
// Script de verificación para producción
// Ejecutar en la consola del navegador en producción

console.log('🔍 Verificando producción...');

// Verificar variables de entorno
console.log('Variables de entorno:');
console.log('PUBLIC_SUPABASE_URL:', import.meta.env.PUBLIC_SUPABASE_URL ? '✅' : '❌');
console.log('PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌');

// Verificar endpoints
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

    // 9. Soluciones específicas para producción
    console.log('\n🎯 SOLUCIONES ESPECÍFICAS PARA PRODUCCIÓN:');
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

productionDebug();




