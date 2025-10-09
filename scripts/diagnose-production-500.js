#!/usr/bin/env node

/**
 * Script para diagnosticar errores HTTP 500 en producción
 * Ejecutar con: node scripts/diagnose-production-500.js
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

async function diagnoseProduction500() {
  console.log('🔍 Diagnosticando errores HTTP 500 en producción...');

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

    // 2. Verificar tablas necesarias
    console.log('\n📊 VERIFICANDO TABLAS NECESARIAS:');
    
    const tables = ['profiles', 'products', 'seller_products', 'seller_status'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`❌ Error en tabla ${table}:`, error.message);
        } else {
          console.log(`✅ Tabla ${table}: OK`);
        }
      } catch (error) {
        console.error(`❌ Error verificando tabla ${table}:`, error.message);
      }
    }

    // 3. Simular consulta del endpoint /api/feed/real
    console.log('\n🔍 SIMULANDO CONSULTA DEL ENDPOINT:');
    
    try {
      // Simular consulta de ofertas
      const { data: offers, error: offersError } = await supabase
        .from('seller_products')
        .select(`
          seller_id,
          product_id,
          price_cents,
          stock,
          active,
          updated_at,
          product:products!inner(
            id,
            title,
            description,
            category,
            image_url
          ),
          seller:profiles!inner(
            id,
            name,
            phone
          )
        `)
        .eq('active', true)
        .gt('stock', 0)
        .lt('price_cents', 5000) // Ofertas: precio menor a 5000 centavos
        .order('updated_at', { ascending: false })
        .limit(4);

      if (offersError) {
        console.error('❌ Error en consulta de ofertas:', offersError);
      } else {
        console.log(`✅ Consulta de ofertas: ${offers.length} productos`);
      }
    } catch (error) {
      console.error('❌ Error simulando consulta:', error.message);
    }

    // 4. Verificar productos de vendedores
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
      .limit(10);

    if (sellerProductsError) {
      console.error('❌ Error obteniendo productos de vendedores:', sellerProductsError);
    } else {
      console.log(`✅ Productos de vendedores: ${sellerProducts.length}`);
      
      // Agrupar por categoría
      const productsByCategory = {};
      sellerProducts.forEach(sp => {
        if (!productsByCategory[sp.product.category]) {
          productsByCategory[sp.product.category] = [];
        }
        productsByCategory[sp.product.category].push(sp);
      });

      console.log('📊 Productos por categoría:');
      Object.keys(productsByCategory).forEach(category => {
        console.log(`   ${category}: ${productsByCategory[category].length} productos`);
      });
    }

    // 5. Verificar estados de vendedores
    console.log('\n🟢 VERIFICANDO ESTADOS DE VENDEDORES:');
    
    const { data: sellerStatus, error: sellerStatusError } = await supabase
      .from('seller_status')
      .select('seller_id, online')
      .limit(10);

    if (sellerStatusError) {
      console.error('❌ Error obteniendo estados de vendedores:', sellerStatusError);
    } else {
      console.log(`✅ Estados de vendedores: ${sellerStatus.length}`);
    }

    // 6. Crear script de verificación para producción
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

// 2. Verificar endpoint /api/feed/real con diferentes parámetros
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
      // Intentar obtener más detalles del error
      const errorText = await response.text();
      console.error('Error details:', errorText);
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

    // 7. Resumen de soluciones
    console.log('\n🎯 SOLUCIONES PARA ERRORES HTTP 500:');
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

    console.log('\n💡 CAUSAS PROBABLES DE LOS ERRORES HTTP 500:');
    console.log('1. Variables de entorno no configuradas en Vercel');
    console.log('2. Endpoint /api/feed/real no desplegado correctamente');
    console.log('3. Problemas de autenticación en producción');
    console.log('4. Problemas de permisos en Supabase');
    console.log('5. Problemas de CORS en producción');
    console.log('6. Problemas con las consultas SQL en producción');
    console.log('7. Problemas con las relaciones entre tablas');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

diagnoseProduction500();










