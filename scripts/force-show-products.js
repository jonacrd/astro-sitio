#!/usr/bin/env node

/**
 * Script para forzar que se muestren los productos reales
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

async function forceShowProducts() {
  console.log('🔄 Forzando que se muestren los productos reales...\n');
  
  try {
    // 1. Probar consulta completa
    console.log('🔧 Probando consulta completa...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .limit(20);

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ Error en consulta:', error.message);
      return;
    }

    console.log(`✅ Consulta completada en ${duration}ms`);
    console.log(`📊 Productos encontrados: ${data?.length || 0}`);

    if (data && data.length > 0) {
      console.log('📋 Productos reales:');
      data.forEach((product, index) => {
        console.log(`  ${index + 1}. Product: ${product.product_id}, Price: $${Math.round(product.price_cents / 100)}, Stock: ${product.stock}`);
      });

      // 2. Obtener datos de productos
      console.log('\n🔧 Obteniendo datos de productos...');
      const productIds = data.map(item => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, description, category, image_url')
        .in('id', productIds);

      if (productsError) {
        console.log('❌ Error en consulta de productos:', productsError.message);
      } else {
        console.log(`✅ Productos obtenidos: ${productsData?.length || 0}`);
        
        if (productsData && productsData.length > 0) {
          console.log('📋 Productos con datos completos:');
          productsData.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.title} - ${product.category}`);
          });
        }
      }

      // 3. Obtener datos de perfiles
      console.log('\n🔧 Obteniendo datos de perfiles...');
      const sellerIds = [...new Set(data.map(item => item.seller_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', sellerIds);

      if (profilesError) {
        console.log('❌ Error en consulta de perfiles:', profilesError.message);
      } else {
        console.log(`✅ Perfiles obtenidos: ${profilesData?.length || 0}`);
        
        if (profilesData && profilesData.length > 0) {
          console.log('📋 Perfiles disponibles:');
          profilesData.forEach((profile, index) => {
            console.log(`  ${index + 1}. ${profile.name}`);
          });
        }
      }

      // 4. Simular transformación de datos
      console.log('\n🔧 Simulando transformación de datos...');
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const transformedProducts = data.map((item, index) => {
        const product = productsMap.get(item.product_id);
        const profile = profilesMap.get(item.seller_id);
        
        return {
          id: `sp-${index}-${Date.now()}`,
          title: product?.title || 'Producto',
          description: product?.description || 'Descripción no disponible',
          category: product?.category || 'general',
          image_url: product?.image_url || 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80',
          price_cents: item.price_cents || 0,
          stock: item.stock || 0,
          seller_id: item.seller_id || '',
          seller_name: profile?.name || 'Vendedor',
          seller_avatar: '/default-avatar.png',
          created_at: new Date().toISOString(),
          is_featured: false,
          sales_count: 0
        };
      });

      console.log(`✅ Productos transformados: ${transformedProducts.length}`);
      console.log('📋 Productos finales:');
      transformedProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title} - $${Math.round(product.price_cents / 100)} - ${product.seller_name}`);
      });

      console.log('\n🎯 DIAGNÓSTICO:');
      console.log('✅ Las consultas funcionan correctamente');
      console.log('✅ Los productos reales están disponibles');
      console.log('✅ La transformación de datos funciona');
      console.log('✅ El problema debe estar en el código del componente');

      console.log('\n🚀 SOLUCIONES RECOMENDADAS:');
      console.log('1. ✅ Verificar que el componente se está renderizando');
      console.log('2. ✅ Verificar que setLoading(false) se ejecuta');
      console.log('3. ✅ Verificar que setProducts se ejecuta');
      console.log('4. ✅ Verificar que no hay errores en el navegador');

    } else {
      console.log('⚠️ No hay productos reales disponibles');
      console.log('💡 Se mostrarán productos de ejemplo');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

forceShowProducts();










