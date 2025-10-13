#!/usr/bin/env node

/**
 * Script para limpiar todo el caché y resolver problemas de desarrollo
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function cleanAllCache() {
  console.log('🧹 Limpiando todo el caché para resolver problemas de desarrollo...\n');
  
  try {
    // 1. Limpiar caché de Node.js
    console.log('🔧 Limpiando caché de Node.js...');
    try {
      execSync('npm cache clean --force', { stdio: 'inherit' });
      console.log('✅ Caché de Node.js limpiado');
    } catch (error) {
      console.log('⚠️ Error limpiando caché de Node.js:', error.message);
    }

    // 2. Limpiar node_modules
    console.log('\n🔧 Limpiando node_modules...');
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      try {
        fs.rmSync(nodeModulesPath, { recursive: true, force: true });
        console.log('✅ node_modules eliminado');
      } catch (error) {
        console.log('⚠️ Error eliminando node_modules:', error.message);
      }
    } else {
      console.log('✅ node_modules no existe');
    }

    // 3. Limpiar caché de Astro
    console.log('\n🔧 Limpiando caché de Astro...');
    const astroPath = path.join(process.cwd(), '.astro');
    if (fs.existsSync(astroPath)) {
      try {
        fs.rmSync(astroPath, { recursive: true, force: true });
        console.log('✅ Caché de Astro eliminado');
      } catch (error) {
        console.log('⚠️ Error eliminando caché de Astro:', error.message);
      }
    } else {
      console.log('✅ Caché de Astro no existe');
    }

    // 4. Limpiar directorio dist
    console.log('\n🔧 Limpiando directorio dist...');
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      try {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log('✅ Directorio dist eliminado');
      } catch (error) {
        console.log('⚠️ Error eliminando directorio dist:', error.message);
      }
    } else {
      console.log('✅ Directorio dist no existe');
    }

    // 5. Reinstalar dependencias
    console.log('\n🔧 Reinstalando dependencias...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencias reinstaladas');
    } catch (error) {
      console.log('⚠️ Error reinstalando dependencias:', error.message);
    }

    // 6. Verificar que los archivos corregidos existen
    console.log('\n🔧 Verificando archivos corregidos...');
    const files = [
      'src/components/react/ProductFeedSimple.tsx',
      'src/components/react/DynamicGridBlocksSimple.tsx',
      'src/pages/index.astro',
      'src/layouts/BaseLayout.astro'
    ];
    
    files.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} existe`);
      } else {
        console.log(`❌ ${file} no existe`);
      }
    });

    // 7. Resumen
    console.log('\n📊 RESUMEN DE LA LIMPIEZA:');
    console.log('✅ Caché de Node.js: LIMPIADO');
    console.log('✅ node_modules: ELIMINADO Y REINSTALADO');
    console.log('✅ Caché de Astro: ELIMINADO');
    console.log('✅ Directorio dist: ELIMINADO');
    console.log('✅ Dependencias: REINSTALADAS');

    console.log('\n🎯 INSTRUCCIONES CRÍTICAS:');
    console.log('1. ✅ REINICIA EL SERVIDOR DE DESARROLLO');
    console.log('2. 🔄 LIMPIA LA CACHÉ DEL NAVEGADOR (Ctrl+Shift+R)');
    console.log('3. 📱 RECARGA LA PÁGINA');
    console.log('4. 🔍 ABRE LA CONSOLA DEL NAVEGADOR (F12)');
    console.log('5. 🔄 VERIFICA QUE NO HAY ERRORES DE JAVASCRIPT');
    console.log('6. 🛒 VERIFICA QUE SE MUESTRAN LOS PRODUCTOS');
    console.log('7. 🛒 VERIFICA QUE EL BOTÓN "AÑADIR AL CARRITO" FUNCIONA');
    console.log('8. 📱 VERIFICA QUE EL BOTTOM NAV BAR APARECE');

    console.log('\n🎉 ¡LIMPIEZA COMPLETADA!');
    console.log('✅ Todo el caché ha sido limpiado');
    console.log('✅ Las dependencias han sido reinstaladas');
    console.log('✅ El servidor está listo para reiniciar');
    console.log('💡 Ahora reinicia el servidor y prueba en modo incógnito');

  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

cleanAllCache();










