#!/usr/bin/env node

/**
 * Script para diagnosticar errores de producción
 * Ejecutar con: node scripts/debug-production-errors.js
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

async function debugProductionErrors() {
  console.log('🔍 Diagnosticando errores de producción...');

  try {
    // 1. Verificar variables de entorno
    console.log('\n🔧 VERIFICANDO VARIABLES DE ENTORNO:');
    console.log(`   PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Configurada' : '❌ Faltante'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Configurada' : '❌ Faltante'}`);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno faltantes. Configurar en Vercel:');
      console.error('   PUBLIC_SUPABASE_URL');
      console.error('   PUBLIC_SUPABASE_ANON_KEY');
      console.error('   SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    // 2. Verificar conexión a Supabase
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

    // 3. Verificar tablas necesarias
    console.log('\n📊 VERIFICANDO TABLAS NECESARIAS:');
    
    const tables = ['profiles', 'products', 'seller_products', 'orders', 'carts', 'cart_items'];
    
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

    // 4. Verificar endpoint /api/feed/real
    console.log('\n🌐 VERIFICANDO ENDPOINT /api/feed/real:');
    
    try {
      const response = await fetch('http://localhost:4321/api/feed/real?limit=4&offers=true');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint /api/feed/real funcionando localmente');
        console.log(`   Productos encontrados: ${data.data?.products?.length || 0}`);
      } else {
        console.error(`❌ Error en endpoint local: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error probando endpoint local:', error.message);
    }

    // 5. Verificar productos en la base de datos
    console.log('\n📦 VERIFICANDO PRODUCTOS EN LA BD:');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(10);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
    } else {
      console.log(`✅ Productos en BD: ${products.length}`);
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} (${product.category})`);
      });
    }

    // 6. Verificar productos de vendedores
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
      sellerProducts.forEach((sp, index) => {
        console.log(`   ${index + 1}. ${sp.product.title} - $${(sp.price_cents / 100).toFixed(2)} (Stock: ${sp.stock})`);
      });
    }

    // 7. Verificar autenticación
    console.log('\n🔐 VERIFICANDO AUTENTICACIÓN:');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log(`✅ Usuarios en BD: ${users.users.length}`);
    }

    // 8. Diagnóstico de errores específicos
    console.log('\n🔍 DIAGNÓSTICO DE ERRORES ESPECÍFICOS:');
    
    console.log('❌ Errores identificados:');
    console.log('   1. AuthSessionMissingError: Auth session missing!');
    console.log('   2. HTTP 500 en /api/feed/real');
    console.log('   3. Error fetching products para diferentes secciones');
    
    console.log('\n💡 SOLUCIONES:');
    console.log('   1. Verificar variables de entorno en Vercel');
    console.log('   2. Verificar que las tablas existan en Supabase');
    console.log('   3. Verificar que el endpoint /api/feed/real esté funcionando');
    console.log('   4. Verificar que haya productos en la BD');
    console.log('   5. Verificar que haya productos de vendedores activos');

    // 9. Crear datos de prueba si no existen
    console.log('\n🛠️  CREANDO DATOS DE PRUEBA SI NO EXISTEN:');
    
    if (products.length === 0) {
      console.log('⚠️  No hay productos en la BD. Creando productos de prueba...');
      
      const testProducts = [
        { title: 'Arepa Reina Pepiada', category: 'comida', description: 'Arepa tradicional venezolana' },
        { title: 'Hamburguesa Clásica', category: 'comida', description: 'Hamburguesa con carne y vegetales' },
        { title: 'Coca Cola 355ml', category: 'bebidas', description: 'Refresco de cola' },
        { title: 'Agua Mineral 500ml', category: 'bebidas', description: 'Agua mineral natural' }
      ];

      const { error: insertError } = await supabase
        .from('products')
        .insert(testProducts);

      if (insertError) {
        console.error('❌ Error creando productos de prueba:', insertError);
      } else {
        console.log('✅ Productos de prueba creados');
      }
    }

    if (sellerProducts.length === 0) {
      console.log('⚠️  No hay productos de vendedores. Creando productos de vendedores...');
      
      // Buscar un vendedor
      const { data: sellers, error: sellersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_seller', true)
        .limit(1);

      if (sellersError || sellers.length === 0) {
        console.error('❌ No hay vendedores para crear productos');
      } else {
        const sellerId = sellers[0].id;
        
        // Crear productos de vendedor
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .limit(4);

        if (productsError || products.length === 0) {
          console.error('❌ No hay productos para crear productos de vendedor');
        } else {
          const sellerProducts = products.map((product, index) => ({
            seller_id: sellerId,
            product_id: product.id,
            price_cents: 1500 + (index * 500),
            stock: 20 + (index * 5),
            active: true
          }));

          const { error: insertError } = await supabase
            .from('seller_products')
            .insert(sellerProducts);

          if (insertError) {
            console.error('❌ Error creando productos de vendedor:', insertError);
          } else {
            console.log('✅ Productos de vendedor creados');
          }
        }
      }
    }

    console.log('\n🎉 ¡Diagnóstico completado!');
    console.log('\n🔗 Para solucionar en producción:');
    console.log('1. Verificar variables de entorno en Vercel');
    console.log('2. Verificar que las tablas existan en Supabase');
    console.log('3. Verificar que haya productos en la BD');
    console.log('4. Verificar que haya productos de vendedores activos');
    console.log('5. Verificar que el endpoint /api/feed/real esté funcionando');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

debugProductionErrors();





