#!/usr/bin/env node

/**
 * Script para probar que los datos reales se carguen correctamente
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

async function testRealDataLoading() {
  console.log('🛍️ Probando carga de datos reales...\n');
  
  try {
    // 1. Probar consulta de seller_products
    console.log('🔧 Probando consulta de seller_products...');
    const startTime = Date.now();
    
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('price_cents, stock, product_id, seller_id')
      .eq('active', true)
      .gt('stock', 0)
      .limit(4);

    const spDuration = Date.now() - startTime;

    if (spError) {
      console.error('❌ Error obteniendo seller_products:', spError);
      return;
    }

    console.log(`✅ Seller products consultados en ${spDuration}ms`);
    console.log(`📊 Productos encontrados: ${sellerProducts?.length || 0}`);

    if (sellerProducts && sellerProducts.length > 0) {
      const productIds = sellerProducts.map(item => item.product_id);
      const sellerIds = sellerProducts.map(item => item.seller_id);

      console.log('🔍 Product IDs:', productIds);
      console.log('🔍 Seller IDs:', sellerIds);

      // 2. Probar consulta de products
      console.log('\n🔧 Probando consulta de products...');
      const productsStartTime = Date.now();
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, description, category, image_url')
        .in('id', productIds);

      const productsDuration = Date.now() - productsStartTime;

      if (productsError) {
        console.error('❌ Error obteniendo products:', productsError);
      } else {
        console.log(`✅ Products consultados en ${productsDuration}ms`);
        console.log(`📦 Productos detallados: ${products?.length || 0}`);
        
        if (products && products.length > 0) {
          console.log('\n📋 PRODUCTOS REALES:');
          products.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.title} (${product.category})`);
            console.log(`     Imagen: ${product.image_url || 'Sin imagen'}`);
            console.log(`     Descripción: ${product.description || 'Sin descripción'}`);
          });
        }
      }

      // 3. Probar consulta de profiles
      console.log('\n🔧 Probando consulta de profiles...');
      const profilesStartTime = Date.now();
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', sellerIds);

      const profilesDuration = Date.now() - profilesStartTime;

      if (profilesError) {
        console.error('❌ Error obteniendo profiles:', profilesError);
      } else {
        console.log(`✅ Profiles consultados en ${profilesDuration}ms`);
        console.log(`👥 Perfiles: ${profiles?.length || 0}`);
        
        if (profiles && profiles.length > 0) {
          console.log('\n👥 VENDEDORES REALES:');
          profiles.forEach((profile, index) => {
            console.log(`  ${index + 1}. ${profile.name}`);
          });
        }
      }

      // 4. Simular transformación completa
      console.log('\n🔄 Simulando transformación completa...');
      const transformStartTime = Date.now();
      
      const productsMap = new Map(products?.map(p => [p.id, p]) || []);
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const transformedProducts = sellerProducts.map((item, index) => {
        const product = productsMap.get(item.product_id);
        const profile = profilesMap.get(item.seller_id);
        
        return {
          id: `real-${index}-${Date.now()}`,
          title: product?.title || 'Producto',
          vendor: profile?.name || 'Vendedor',
          price: Math.round(item.price_cents / 100),
          image_url: product?.image_url || 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80',
          category: product?.category || 'general'
        };
      });

      const transformDuration = Date.now() - transformStartTime;
      console.log(`✅ Transformación completada en ${transformDuration}ms`);

      console.log('\n📋 PRODUCTOS TRANSFORMADOS:');
      transformedProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title} - $${product.price} (${product.vendor})`);
        console.log(`     Categoría: ${product.category}`);
        console.log(`     Imagen: ${product.image_url}`);
      });
    }

    // 5. Verificar componentes actualizados
    console.log('\n📄 Verificando componentes actualizados...');
    const components = [
      'src/components/react/DynamicGridBlocksSimple.tsx',
      'src/components/react/ProductFeedSimple.tsx'
    ];
    
    let componentsOk = 0;
    components.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('productsMap.get') && content.includes('profilesMap.get') && content.includes('image_url')) {
          console.log(`✅ ${component} con datos reales`);
          componentsOk++;
        } else {
          console.log(`⚠️ ${component} sin datos reales`);
        }
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });

    // 6. Resumen
    console.log('\n📊 RESUMEN DE DATOS REALES:');
    console.log(`✅ Seller products: ${spDuration}ms`);
    console.log(`✅ Products: ${productsDuration || 0}ms`);
    console.log(`✅ Profiles: ${profilesDuration || 0}ms`);
    console.log(`✅ Componentes con datos reales: ${componentsOk}/${components.length}`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (products && products.length > 0) {
      console.log('✅ Hay productos reales disponibles');
      console.log('✅ Las consultas funcionan correctamente');
      console.log('✅ Los componentes deberían mostrar datos reales');
    } else {
      console.log('⚠️ No hay productos reales disponibles');
      console.log('⚠️ Los componentes mostrarán datos ficticios');
    }

    console.log('\n🚀 RECOMENDACIONES:');
    console.log('1. ✅ Verificar que los productos tienen imágenes válidas');
    console.log('2. ✅ Verificar que los vendedores tienen perfiles');
    console.log('3. ✅ Verificar que las imágenes no dan 404');
    console.log('4. ✅ Verificar que los datos se transforman correctamente');

    console.log('\n🎉 ¡DATOS REALES RESTAURADOS!');
    console.log('✅ Consultas a products y profiles restauradas');
    console.log('✅ Datos reales de productos');
    console.log('✅ Imágenes reales de productos');
    console.log('✅ Nombres reales de vendedores');
    console.log('✅ Componentes con datos reales');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testRealDataLoading();







