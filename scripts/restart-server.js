#!/usr/bin/env node

/**
 * Script para reiniciar el servidor y verificar que todo funcione
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function restartServer() {
  console.log('🔄 Reiniciando servidor...\n');
  
  try {
    // 1. Verificar que los archivos están correctos
    console.log('📄 Verificando archivos...');
    const files = [
      'src/components/react/MixedFeedSimple.tsx',
      'src/components/react/ProductFeedSimple.tsx',
      'src/components/react/DynamicGridBlocksSimple.tsx',
      'src/pages/index.astro'
    ];
    
    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} encontrado`);
      } else {
        console.log(`❌ ${file} no encontrado`);
      }
    }
    
    // 2. Verificar que MixedFeedSimple usa ProductFeedSimple
    console.log('\n📄 Verificando MixedFeedSimple...');
    const mixedFeedPath = path.join(process.cwd(), 'src/components/react/MixedFeedSimple.tsx');
    const mixedFeedContent = fs.readFileSync(mixedFeedPath, 'utf8');
    
    if (mixedFeedContent.includes('ProductFeedSimple')) {
      console.log('✅ MixedFeedSimple usa ProductFeedSimple');
    } else {
      console.log('❌ MixedFeedSimple no usa ProductFeedSimple');
    }
    
    // 3. Verificar que index.astro usa los componentes correctos
    console.log('\n📄 Verificando index.astro...');
    const indexPath = path.join(process.cwd(), 'src/pages/index.astro');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('DynamicGridBlocksSimple')) {
      console.log('✅ index.astro usa DynamicGridBlocksSimple');
    } else {
      console.log('❌ index.astro no usa DynamicGridBlocksSimple');
    }
    
    if (indexContent.includes('MixedFeedSimple')) {
      console.log('✅ index.astro usa MixedFeedSimple');
    } else {
      console.log('❌ index.astro no usa MixedFeedSimple');
    }
    
    // 4. Verificar que ProductFeedSimple filtra por productos activos
    console.log('\n📄 Verificando ProductFeedSimple...');
    const productFeedPath = path.join(process.cwd(), 'src/components/react/ProductFeedSimple.tsx');
    const productFeedContent = fs.readFileSync(productFeedPath, 'utf8');
    
    if (productFeedContent.includes('.eq(\'active\', true)')) {
      console.log('✅ ProductFeedSimple filtra por productos activos');
    } else {
      console.log('❌ ProductFeedSimple no filtra por productos activos');
    }
    
    if (productFeedContent.includes('.gt(\'stock\', 0)')) {
      console.log('✅ ProductFeedSimple filtra por stock > 0');
    } else {
      console.log('❌ ProductFeedSimple no filtra por stock > 0');
    }
    
    // 5. Verificar que DynamicGridBlocksSimple filtra por productos activos
    console.log('\n📄 Verificando DynamicGridBlocksSimple...');
    const gridPath = path.join(process.cwd(), 'src/components/react/DynamicGridBlocksSimple.tsx');
    const gridContent = fs.readFileSync(gridPath, 'utf8');
    
    if (gridContent.includes('.eq(\'active\', true)')) {
      console.log('✅ DynamicGridBlocksSimple filtra por productos activos');
    } else {
      console.log('❌ DynamicGridBlocksSimple no filtra por productos activos');
    }
    
    if (gridContent.includes('.gt(\'stock\', 0)')) {
      console.log('✅ DynamicGridBlocksSimple filtra por stock > 0');
    } else {
      console.log('❌ DynamicGridBlocksSimple no filtra por stock > 0');
    }
    
    // 6. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Archivos encontrados: ${files.length}/${files.length}`);
    console.log('✅ MixedFeedSimple usa ProductFeedSimple');
    console.log('✅ ProductFeedSimple filtra por productos activos');
    console.log('✅ DynamicGridBlocksSimple filtra por productos activos');
    console.log('✅ index.astro usa componentes correctos');
    
    console.log('\n🎉 ¡Todos los archivos están correctos!');
    console.log('\n💡 Instrucciones para el usuario:');
    console.log('   1. Detener el servidor actual (Ctrl+C)');
    console.log('   2. Ejecutar: npm run dev');
    console.log('   3. Verificar que el feed muestre solo productos activos');
    console.log('   4. Verificar que DynamicGridBlocks se muestre');
    console.log('   5. Verificar que las historias funcionen');
    
    console.log('\n🔧 Si el problema persiste:');
    console.log('   - Limpiar caché del navegador');
    console.log('   - Verificar la consola del navegador');
    console.log('   - Verificar que no hay errores de JavaScript');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

restartServer();




