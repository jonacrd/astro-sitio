#!/usr/bin/env node

/**
 * Script para verificar productos activos usando la API
 */

import fetch from 'node-fetch';

async function checkActiveProductsAPI() {
  console.log('🔍 Verificando productos activos usando API...\n');
  
  try {
    // Probar endpoint del feed
    console.log('📦 Probando /api/feed/simple...');
    const feedResponse = await fetch('http://localhost:4321/api/feed/simple');
    
    if (!feedResponse.ok) {
      console.log('❌ Error en endpoint del feed:', feedResponse.status);
      return;
    }
    
    const feedData = await feedResponse.json();
    
    if (!feedData.success) {
      console.log('❌ Error en respuesta del feed:', feedData.error);
      return;
    }
    
    console.log(`✅ Feed: ${feedData.data.products.length} productos encontrados\n`);
    
    if (feedData.data.products.length === 0) {
      console.log('❌ NO HAY PRODUCTOS EN EL FEED');
      return;
    }
    
    // Mostrar productos del feed
    console.log('🛍️ PRODUCTOS EN EL FEED:');
    feedData.data.products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} - $${product.price} (${product.sellerName})`);
    });
    
    // Agrupar por vendedor
    const productsBySeller = {};
    feedData.data.products.forEach(product => {
      if (!productsBySeller[product.sellerName]) {
        productsBySeller[product.sellerName] = [];
      }
      productsBySeller[product.sellerName].push(product);
    });
    
    console.log('\n🏪 VENDEDORES EN EL FEED:');
    Object.keys(productsBySeller).forEach(sellerName => {
      console.log(`\n📦 ${sellerName}:`);
      productsBySeller[sellerName].forEach(product => {
        console.log(`   ✅ ${product.title} - $${product.price} - Stock: ${product.stock}`);
      });
    });
    
    // Probar búsqueda
    console.log('\n🔍 Probando búsqueda "cerveza"...');
    const searchResponse = await fetch('http://localhost:4321/api/search/simple?q=cerveza');
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`✅ Búsqueda: ${searchData.data.results.length} resultados para "cerveza"`);
      
      if (searchData.data.results.length > 0) {
        console.log('🔍 Resultados de búsqueda:');
        searchData.data.results.forEach((product, index) => {
          console.log(`${index + 1}. ${product.title} - $${product.price} (${product.sellerName})`);
        });
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Productos en feed: ${feedData.data.products.length}`);
    console.log(`✅ Vendedores activos: ${Object.keys(productsBySeller).length}`);
    
    console.log('\n🎯 CATEGORÍAS DISPONIBLES:');
    const categories = [...new Set(feedData.data.products.map(p => p.category))];
    categories.forEach(category => {
      const count = feedData.data.products.filter(p => p.category === category).length;
      console.log(`   📦 ${category}: ${count} productos`);
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.log('\n💡 Asegúrate de que el servidor esté ejecutándose:');
    console.log('   npm run dev');
  }
}

checkActiveProductsAPI();








