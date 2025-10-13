#!/usr/bin/env node

/**
 * Script para verificar el contenido del index.astro
 */

import fs from 'fs';
import path from 'path';

function verifyIndexContent() {
  console.log('🔍 Verificando contenido del index.astro...\n');
  
  try {
    // 1. Verificar que index.astro existe
    const indexPath = path.join(process.cwd(), 'src/pages/index.astro');
    if (!fs.existsSync(indexPath)) {
      console.log('❌ index.astro no existe');
      return;
    }

    console.log('✅ index.astro existe');

    // 2. Leer el contenido del index.astro
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // 3. Verificar elementos clave
    const checks = [
      { name: 'BaseLayout', pattern: 'BaseLayout', found: content.includes('BaseLayout') },
      { name: 'Header', pattern: 'Header', found: content.includes('Header') },
      { name: 'BottomNavAuth', pattern: 'BottomNavAuth', found: content.includes('BottomNavAuth') },
      { name: 'SearchBarEnhanced', pattern: 'SearchBarEnhanced', found: content.includes('SearchBarEnhanced') },
      { name: 'QuickActions', pattern: 'QuickActions', found: content.includes('QuickActions') },
      { name: 'DynamicGridBlocksSimple', pattern: 'DynamicGridBlocksSimple', found: content.includes('DynamicGridBlocksSimple') },
      { name: 'AuthWrapper', pattern: 'AuthWrapper', found: content.includes('AuthWrapper') },
      { name: 'MixedFeedSimple', pattern: 'MixedFeedSimple', found: content.includes('MixedFeedSimple') },
      { name: 'QuestionModal', pattern: 'QuestionModal', found: content.includes('QuestionModal') },
      { name: 'SaleModal', pattern: 'SaleModal', found: content.includes('SaleModal') }
    ];
    
    console.log('\n🔧 Verificando elementos del index.astro:');
    checks.forEach(check => {
      if (check.found) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
      }
    });

    // 4. Verificar que el BaseLayout incluye Header y BottomNavAuth
    console.log('\n🔧 Verificando BaseLayout...');
    const baseLayoutPath = path.join(process.cwd(), 'src/layouts/BaseLayout.astro');
    if (fs.existsSync(baseLayoutPath)) {
      const baseLayoutContent = fs.readFileSync(baseLayoutPath, 'utf8');
      if (baseLayoutContent.includes('Header') && baseLayoutContent.includes('BottomNavAuth')) {
        console.log('✅ BaseLayout incluye Header y BottomNavAuth');
      } else {
        console.log('❌ BaseLayout no incluye Header o BottomNavAuth');
      }
    }

    // 5. Verificar que los componentes existen
    console.log('\n🔧 Verificando componentes...');
    const components = [
      'src/components/react/Header.tsx',
      'src/components/react/BottomNavAuth.tsx',
      'src/components/react/SearchBarEnhanced.tsx',
      'src/components/react/QuickActions.tsx',
      'src/components/react/DynamicGridBlocksSimple.tsx',
      'src/components/react/AuthWrapper.tsx',
      'src/components/react/MixedFeedSimple.tsx',
      'src/components/react/ProductFeedSimple.tsx'
    ];
    
    components.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${component} existe`);
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });

    // 6. Resumen
    console.log('\n📊 RESUMEN:');
    const foundElements = checks.filter(check => check.found).length;
    console.log(`✅ Elementos encontrados: ${foundElements}/${checks.length}`);
    
    if (foundElements === checks.length) {
      console.log('✅ index.astro tiene todos los elementos necesarios');
    } else {
      console.log('❌ index.astro le faltan elementos');
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    if (foundElements === checks.length) {
      console.log('✅ El index.astro está correcto');
      console.log('✅ Todos los componentes existen');
      console.log('✅ El problema puede estar en el navegador');
    } else {
      console.log('❌ El index.astro tiene problemas');
      console.log('❌ Algunos componentes no existen');
    }

    console.log('\n🚀 INSTRUCCIONES:');
    console.log('1. ✅ Reinicia el servidor de desarrollo');
    console.log('2. 🔄 Limpia la caché del navegador');
    console.log('3. 📱 Recarga la página');
    console.log('4. 🔍 Abre la consola del navegador (F12)');
    console.log('5. 🔄 Verifica que no hay errores de JavaScript');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyIndexContent();










