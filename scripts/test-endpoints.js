#!/usr/bin/env node

/**
 * Script para probar los endpoints
 */

async function testEndpoints() {
  console.log('🔍 Probando endpoints...\n');
  
  try {
    // Probar endpoint de feed
    console.log('📦 Probando /api/feed/simple...');
    const feedResponse = await fetch('http://localhost:4321/api/feed/simple');
    const feedData = await feedResponse.json();
    
    if (feedData.success) {
      console.log(`✅ Feed: ${feedData.data.products.length} productos encontrados`);
      feedData.data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} - $${(product.price_cents / 100).toLocaleString()} (${product.seller_name})`);
      });
    } else {
      console.log('❌ Feed error:', feedData.error);
    }
    
    // Probar endpoint de búsqueda
    console.log('\n🔍 Probando /api/search/simple?q=cerveza...');
    const searchResponse = await fetch('http://localhost:4321/api/search/simple?q=cerveza');
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log(`✅ Búsqueda: ${searchData.data.products.length} productos encontrados`);
      searchData.data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} - $${(product.price_cents / 100).toLocaleString()} (${product.seller_name})`);
      });
    } else {
      console.log('❌ Búsqueda error:', searchData.error);
    }
    
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Feed: ${feedData.success ? 'FUNCIONA' : 'ERROR'}`);
    console.log(`✅ Búsqueda: ${searchData.success ? 'FUNCIONA' : 'ERROR'}`);
    
    if (feedData.success && searchData.success) {
      console.log('\n🎉 ¡ENDPOINTS FUNCIONAN CORRECTAMENTE!');
      console.log('✅ La aplicación debería mostrar productos');
    } else {
      console.log('\n⚠️ HAY PROBLEMAS CON LOS ENDPOINTS');
      console.log('❌ La aplicación mostrará "No hay productos disponibles"');
    }

  } catch (error) {
    console.error('❌ Error probando endpoints:', error);
    console.log('\n💡 Asegúrate de que el servidor esté ejecutándose en localhost:4321');
  }
}

testEndpoints();






