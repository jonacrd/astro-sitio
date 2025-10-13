#!/usr/bin/env node

/**
 * Script para debuggear el ProductSelector y verificar que los productos se carguen correctamente
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProductSelector() {
  console.log('🔍 Debuggeando ProductSelector...\n');
  
  try {
    // 1. Verificar productos disponibles
    console.log('📦 Verificando productos disponibles...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category, description')
      .order('title')
      .limit(10);
    
    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }
    
    console.log(`✅ Productos encontrados: ${products.length}`);
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} (${product.category})`);
    });
    
    // 2. Verificar vendedores
    console.log('\n👤 Verificando vendedores...');
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true)
      .limit(3);
    
    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }
    
    console.log(`✅ Vendedores encontrados: ${sellers.length}`);
    sellers.forEach((seller, index) => {
      console.log(`  ${index + 1}. ${seller.name} (${seller.id})`);
    });
    
    // 3. Verificar productos de vendedores
    console.log('\n🛒 Verificando productos de vendedores...');
    const { data: sellerProducts, error: sellerProductsError } = await supabase
      .from('seller_products')
      .select(`
        price_cents,
        stock,
        active,
        products (title, category)
      `)
      .limit(5);
    
    if (sellerProductsError) {
      console.error('❌ Error obteniendo productos de vendedores:', sellerProductsError);
      return;
    }
    
    console.log(`✅ Productos de vendedores: ${sellerProducts.length}`);
    sellerProducts.forEach((sp, index) => {
      console.log(`  ${index + 1}. ${sp.products?.title || 'Sin nombre'}: $${(sp.price_cents/100).toLocaleString('es-CL')} (Stock: ${sp.stock}, Activo: ${sp.active})`);
    });
    
    // 4. Simular búsqueda
    console.log('\n🔍 Simulando búsqueda...');
    const searchTerm = 'cerveza';
    const filteredProducts = products.filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`✅ Productos que contienen "${searchTerm}": ${filteredProducts.length}`);
    filteredProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} (${product.category})`);
    });
    
    // 5. Simular filtro por categoría
    console.log('\n🏷️ Simulando filtro por categoría...');
    const category = 'bebidas';
    const categoryProducts = products.filter(product => product.category === category);
    
    console.log(`✅ Productos en categoría "${category}": ${categoryProducts.length}`);
    categoryProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title}`);
    });
    
    console.log('\n🎉 ¡Debug completado exitosamente!');
    console.log('\n💡 Si los productos no aparecen en la interfaz:');
    console.log('   1. Verifica que el usuario esté autenticado');
    console.log('   2. Revisa la consola del navegador para errores');
    console.log('   3. Asegúrate de que el componente ProductSelector se esté cargando');
    console.log('   4. Verifica que el sellerId se esté pasando correctamente');
    
  } catch (error) {
    console.error('❌ Error en el debug:', error);
  }
}

debugProductSelector();










