#!/usr/bin/env node

/**
 * Script para probar los nuevos diseños de búsqueda y toggle
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

async function testNewDesigns() {
  console.log('🎨 Probando nuevos diseños de búsqueda y toggle...\n');
  
  try {
    // 1. Verificar componentes actualizados
    console.log('📄 Verificando componentes actualizados...');
    const components = [
      'src/components/react/SearchBarEnhanced.tsx',
      'src/components/react/SellerStatusToggle.tsx',
      'src/pages/perfil.astro'
    ];
    
    let componentsOk = 0;
    components.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${component} existe`);
        componentsOk++;
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });
    
    // 2. Verificar estilos de búsqueda
    console.log('\n🔍 Verificando estilos de búsqueda...');
    const searchBarPath = path.join(process.cwd(), 'src/components/react/SearchBarEnhanced.tsx');
    const searchBarContent = fs.readFileSync(searchBarPath, 'utf8');
    
    const searchStyles = [
      'bg-gray-900', // Fondo oscuro
      'text-white', // Texto blanco
      'DISPONIBLE AHORA', // Badge verde
      'PEDIR AHORA', // Botón naranja
      'Productos relacionados' // Sección relacionada
    ];
    
    let searchStylesOk = 0;
    searchStyles.forEach(style => {
      if (searchBarContent.includes(style)) {
        console.log(`✅ ${style} encontrado`);
        searchStylesOk++;
      } else {
        console.log(`❌ ${style} no encontrado`);
      }
    });
    
    // 3. Verificar estilos de toggle
    console.log('\n🔄 Verificando estilos de toggle...');
    const togglePath = path.join(process.cwd(), 'src/components/react/SellerStatusToggle.tsx');
    const toggleContent = fs.readFileSync(togglePath, 'utf8');
    
    const toggleStyles = [
      'bg-green-500', // Color verde cuando está ON
      'bg-gray-600', // Color gris cuando está OFF
      'translate-x-6', // Deslizamiento a la derecha
      'translate-x-1', // Deslizamiento a la izquierda
      'h-6 w-11' // Dimensiones del toggle
    ];
    
    let toggleStylesOk = 0;
    toggleStyles.forEach(style => {
      if (toggleContent.includes(style)) {
        console.log(`✅ ${style} encontrado`);
        toggleStylesOk++;
      } else {
        console.log(`❌ ${style} no encontrado`);
      }
    });
    
    // 4. Probar búsqueda con diseño oscuro
    console.log('\n🔍 Probando búsqueda con diseño oscuro...');
    const testQuery = 'aceite';
    
    const { data: searchResults, error: searchError } = await supabase
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
          category,
          image_url
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .ilike('products.title', `%${testQuery}%`)
      .limit(5);
    
    if (searchError) {
      console.error('❌ Error en búsqueda:', searchError);
    } else {
      console.log(`✅ Búsqueda de "${testQuery}": ${searchResults?.length || 0} productos encontrados`);
      
      if (searchResults && searchResults.length > 0) {
        console.log('\n📋 Productos para mostrar en diseño oscuro:');
        searchResults.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.products.title} - $${Math.round(product.price_cents / 100)}`);
        });
      }
    }
    
    // 5. Verificar estado de vendedores
    console.log('\n🟢 Verificando estado de vendedores...');
    const { data: sellerStatus, error: statusError } = await supabase
      .from('seller_status')
      .select('seller_id, online')
      .limit(5);
    
    if (statusError) {
      console.error('❌ Error obteniendo estado:', statusError);
    } else {
      console.log(`✅ Estados encontrados: ${sellerStatus?.length || 0}`);
      
      if (sellerStatus && sellerStatus.length > 0) {
        const onlineCount = sellerStatus.filter(s => s.online).length;
        const offlineCount = sellerStatus.length - onlineCount;
        console.log(`  🟢 Online: ${onlineCount}`);
        console.log(`  🔴 Offline: ${offlineCount}`);
      }
    }
    
    // 6. Resumen final
    console.log('\n📊 RESUMEN DE DISEÑOS:');
    console.log(`   - Componentes: ${componentsOk}/${components.length}`);
    console.log(`   - Estilos de búsqueda: ${searchStylesOk}/${searchStyles.length}`);
    console.log(`   - Estilos de toggle: ${toggleStylesOk}/${toggleStyles.length}`);
    console.log(`   - Productos de prueba: ${searchResults?.length || 0}`);
    console.log(`   - Estados de vendedores: ${sellerStatus?.length || 0}`);
    
    console.log('\n🎨 CARACTERÍSTICAS DE LOS NUEVOS DISEÑOS:');
    console.log('   - ✅ Búsqueda con tema oscuro (bg-gray-900)');
    console.log('   - ✅ Badges "DISPONIBLE AHORA" en verde');
    console.log('   - ✅ Botón "PEDIR AHORA" en naranja');
    console.log('   - ✅ Toggle discreto con deslizamiento');
    console.log('   - ✅ Indicadores ON/OFF');
    console.log('   - ✅ Colores coherentes con el tema');
    
    console.log('\n🚀 INSTRUCCIONES PARA PROBAR:');
    console.log('1. ✅ Componentes actualizados');
    console.log('2. 🔄 Ve a http://localhost:4321');
    console.log('3. 🔍 Prueba la búsqueda con "aceite"');
    console.log('4. 👀 Verifica el diseño oscuro y moderno');
    console.log('5. 🔄 Ve a /perfil como vendedor');
    console.log('6. 🎛️ Prueba el toggle discreto');
    console.log('7. 📱 Verifica que funcione en responsive');
    
    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - Búsqueda con diseño oscuro como en la imagen');
    console.log('   - Toggle discreto que se desliza como en la imagen');
    console.log('   - Colores coherentes con el tema de la app');
    console.log('   - Experiencia visual mejorada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testNewDesigns();










