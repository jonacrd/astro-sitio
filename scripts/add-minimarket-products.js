#!/usr/bin/env node

/**
 * Script para agregar productos a Minimarket La Esquina
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMinimarketProducts() {
  console.log('🏪 Agregando productos a Minimarket La Esquina...\n');
  
  try {
    // 1. Obtener ID de Minimarket La Esquina
    console.log('👤 Buscando Minimarket La Esquina...');
    const { data: minimarket, error: minimarketError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('name', 'Minimarket La Esquina')
      .single();

    if (minimarketError || !minimarket) {
      console.error('❌ Minimarket La Esquina no encontrado:', minimarketError);
      return;
    }

    console.log(`✅ Minimarket La Esquina encontrado: ${minimarket.name} (${minimarket.id})`);

    // 2. Obtener algunos productos base para agregar
    console.log('\n📦 Obteniendo productos base...');
    const { data: baseProducts, error: baseProductsError } = await supabase
      .from('products')
      .select('id, title, description, category, image_url')
      .limit(10);

    if (baseProductsError) {
      console.error('❌ Error obteniendo productos base:', baseProductsError);
      return;
    }

    console.log(`📋 Productos base disponibles: ${baseProducts?.length || 0}`);

    // 3. Agregar productos a Minimarket La Esquina
    if (baseProducts && baseProducts.length > 0) {
      console.log('\n🛒 Agregando productos a Minimarket La Esquina...');
      
      const minimarketProducts = baseProducts.slice(0, 5).map(product => ({
        seller_id: minimarket.id,
        product_id: product.id,
        price_cents: Math.floor(Math.random() * 5000) + 1000, // Precio entre $10 y $60
        stock: Math.floor(Math.random() * 20) + 5, // Stock entre 5 y 25
        active: true
      }));

      const { error: insertError } = await supabase
        .from('seller_products')
        .insert(minimarketProducts);

      if (insertError) {
        console.error('❌ Error agregando productos:', insertError);
        return;
      }

      console.log('✅ Productos agregados a Minimarket La Esquina');
    }

    // 4. Verificar productos activos de Minimarket La Esquina
    console.log('\n✅ Verificando productos activos de Minimarket La Esquina...');
    const { data: minimarketProducts, error: minimarketProductsError } = await supabase
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
          category
        )
      `)
      .eq('seller_id', minimarket.id)
      .eq('active', true)
      .gt('stock', 0);

    if (minimarketProductsError) {
      console.error('❌ Error obteniendo productos de Minimarket:', minimarketProductsError);
      return;
    }

    console.log(`🟢 Productos activos de Minimarket La Esquina: ${minimarketProducts?.length || 0}`);
    
    if (minimarketProducts && minimarketProducts.length > 0) {
      console.log('\n📋 PRODUCTOS ACTIVOS DE MINIMARKET LA ESQUINA:');
      minimarketProducts.forEach(product => {
        console.log(`  - ${product.products.title} - Stock: ${product.stock} - $${Math.round(product.price_cents / 100)}`);
      });
    }

    // 5. Verificar productos activos de Diego Ramírez
    console.log('\n✅ Verificando productos activos de Diego Ramírez...');
    const { data: diegoProducts, error: diegoProductsError } = await supabase
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
          category
        )
      `)
      .eq('seller_id', '8f0a8848-8647-41e7-b9d0-323ee000d379') // Diego Ramírez ID
      .eq('active', true)
      .gt('stock', 0);

    if (diegoProductsError) {
      console.error('❌ Error obteniendo productos de Diego:', diegoProductsError);
      return;
    }

    console.log(`🟢 Productos activos de Diego Ramírez: ${diegoProducts?.length || 0}`);

    // 6. Resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Diego Ramírez: ${diegoProducts?.length || 0} productos activos`);
    console.log(`✅ Minimarket La Esquina: ${minimarketProducts?.length || 0} productos activos`);
    console.log(`🔍 Total vendedores activos: 2`);

    console.log('\n🚀 INSTRUCCIONES PARA PROBAR:');
    console.log('1. ✅ Verifica que Diego Ramírez y Minimarket La Esquina tengan productos activos');
    console.log('2. 🔍 Prueba la búsqueda de productos en la aplicación');
    console.log('3. 📱 Verifica que aparezcan productos de ambos vendedores');
    console.log('4. 🎯 Diego Ramírez debe aparecer primero (vendedor online)');

  } catch (error) {
    console.error('❌ Error agregando productos:', error);
  }
}

addMinimarketProducts();










