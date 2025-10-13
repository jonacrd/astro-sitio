#!/usr/bin/env node

/**
 * Script para corregir problemas de producción
 * Ejecutar con: node scripts/fix-production-issues.js
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

async function fixProductionIssues() {
  console.log('🔧 Corrigiendo problemas de producción...');

  try {
    // 1. Verificar y corregir endpoint /api/feed/real
    console.log('\n🌐 VERIFICANDO ENDPOINT /api/feed/real:');
    
    // Probar diferentes parámetros
    const testParams = [
      '?limit=4&offers=true',
      '?limit=6&featured=true', 
      '?limit=8&new=true',
      '?limit=6&category=comida',
      '?limit=4&category=bebidas'
    ];

    for (const params of testParams) {
      try {
        const response = await fetch(`http://localhost:4321/api/feed/real${params}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${params}: ${data.data?.products?.length || 0} productos`);
        } else {
          console.error(`❌ ${params}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ ${params}: ${error.message}`);
      }
    }

    // 2. Verificar que hay productos suficientes
    console.log('\n📦 VERIFICANDO PRODUCTOS SUFICIENTES:');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category');

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    console.log(`✅ Productos totales: ${products.length}`);

    // Agrupar por categoría
    const productsByCategory = {};
    products.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });

    console.log('📊 Productos por categoría:');
    Object.keys(productsByCategory).forEach(category => {
      console.log(`   ${category}: ${productsByCategory[category].length} productos`);
    });

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
      .gt('stock', 0);

    if (sellerProductsError) {
      console.error('❌ Error obteniendo productos de vendedores:', sellerProductsError);
      return;
    }

    console.log(`✅ Productos de vendedores activos: ${sellerProducts.length}`);

    // Agrupar por categoría
    const sellerProductsByCategory = {};
    sellerProducts.forEach(sp => {
      if (!sellerProductsByCategory[sp.product.category]) {
        sellerProductsByCategory[sp.product.category] = [];
      }
      sellerProductsByCategory[sp.product.category].push(sp);
    });

    console.log('📊 Productos de vendedores por categoría:');
    Object.keys(sellerProductsByCategory).forEach(category => {
      console.log(`   ${category}: ${sellerProductsByCategory[category].length} productos`);
    });

    // 4. Crear productos adicionales si faltan
    console.log('\n🛠️  CREANDO PRODUCTOS ADICIONALES SI FALTAN:');
    
    if (sellerProductsByCategory['comida'] < 5) {
      console.log('⚠️  Pocos productos de comida. Creando más...');
      
      // Buscar productos de comida
      const { data: comidaProducts, error: comidaError } = await supabase
        .from('products')
        .select('id')
        .eq('category', 'comida')
        .limit(3);

      if (!comidaError && comidaProducts.length > 0) {
        // Buscar vendedores
        const { data: sellers, error: sellersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_seller', true)
          .limit(2);

        if (!sellersError && sellers.length > 0) {
          const sellerProducts = [];
          sellers.forEach(seller => {
            comidaProducts.forEach(product => {
              sellerProducts.push({
                seller_id: seller.id,
                product_id: product.id,
                price_cents: 1500 + Math.random() * 2000,
                stock: 20 + Math.floor(Math.random() * 30),
                active: true
              });
            });
          });

          const { error: insertError } = await supabase
            .from('seller_products')
            .insert(sellerProducts);

          if (insertError) {
            console.error('❌ Error creando productos de comida:', insertError);
          } else {
            console.log('✅ Productos de comida creados');
          }
        }
      }
    }

    if (sellerProductsByCategory['bebidas'] < 3) {
      console.log('⚠️  Pocos productos de bebidas. Creando más...');
      
      // Buscar productos de bebidas
      const { data: bebidasProducts, error: bebidasError } = await supabase
        .from('products')
        .select('id')
        .eq('category', 'bebidas')
        .limit(2);

      if (!bebidasError && bebidasProducts.length > 0) {
        // Buscar vendedores
        const { data: sellers, error: sellersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_seller', true)
          .limit(2);

        if (!sellersError && sellers.length > 0) {
          const sellerProducts = [];
          sellers.forEach(seller => {
            bebidasProducts.forEach(product => {
              sellerProducts.push({
                seller_id: seller.id,
                product_id: product.id,
                price_cents: 800 + Math.random() * 1000,
                stock: 15 + Math.floor(Math.random() * 25),
                active: true
              });
            });
          });

          const { error: insertError } = await supabase
            .from('seller_products')
            .insert(sellerProducts);

          if (insertError) {
            console.error('❌ Error creando productos de bebidas:', insertError);
          } else {
            console.log('✅ Productos de bebidas creados');
          }
        }
      }
    }

    // 5. Verificar autenticación
    console.log('\n🔐 VERIFICANDO AUTENTICACIÓN:');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log(`✅ Usuarios en BD: ${users.users.length}`);
    }

    // 6. Crear script de verificación para producción
    console.log('\n📝 CREANDO SCRIPT DE VERIFICACIÓN PARA PRODUCCIÓN:');
    
    const verificationScript = `
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

    // 7. Resumen de soluciones
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

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

fixProductionIssues();














