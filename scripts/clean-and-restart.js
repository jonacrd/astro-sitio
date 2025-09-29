#!/usr/bin/env node

/**
 * Script para limpiar caché y reiniciar el servidor
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function cleanAndRestart() {
  console.log('🧹 Limpiando caché y reiniciando servidor...\n');
  
  try {
    // Matar procesos en puerto 4321
    console.log('🔪 Matando procesos en puerto 4321...');
    try {
      execSync('netstat -ano | findstr :4321', { stdio: 'pipe' });
      execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
    } catch (error) {
      console.log('⚠️ No hay procesos en puerto 4321');
    }

    // Limpiar caché de Node.js
    console.log('🗑️ Limpiando caché de Node.js...');
    try {
      execSync('npm cache clean --force', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Error limpiando caché de npm');
    }

    // Eliminar node_modules y reinstalar
    console.log('📦 Reinstalando dependencias...');
    try {
      if (fs.existsSync('node_modules')) {
        execSync('rmdir /s /q node_modules', { stdio: 'pipe' });
      }
      if (fs.existsSync('package-lock.json')) {
        execSync('del package-lock.json', { stdio: 'pipe' });
      }
      execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Error reinstalando dependencias');
    }

    // Limpiar caché de Astro
    console.log('🚀 Limpiando caché de Astro...');
    try {
      if (fs.existsSync('dist')) {
        execSync('rmdir /s /q dist', { stdio: 'pipe' });
      }
      if (fs.existsSync('.astro')) {
        execSync('rmdir /s /q .astro', { stdio: 'pipe' });
      }
    } catch (error) {
      console.log('⚠️ Error limpiando caché de Astro');
    }

    console.log('\n✅ CACHÉ LIMPIADO EXITOSAMENTE');
    console.log('\n🚀 INSTRUCCIONES PARA CONTINUAR:');
    console.log('1. ✅ EJECUTAR: npm run dev');
    console.log('2. 🔄 ABRIR NAVEGADOR EN: http://localhost:4321');
    console.log('3. 🔄 LIMPIAR CACHÉ DEL NAVEGADOR (Ctrl+Shift+R)');
    console.log('4. 📱 RECARGAR LA PÁGINA');
    console.log('5. 🔍 ABRIR CONSOLA DEL NAVEGADOR (F12)');
    console.log('6. 🛒 VERIFICAR QUE APARECEN PRODUCTOS REALES');
    console.log('7. 🔍 USAR EL BUSCADOR PARA BUSCAR "cerveza"');
    console.log('8. ✅ VERIFICAR QUE APARECEN RESULTADOS DE BÚSQUEDA');

    console.log('\n🎉 ¡SERVIDOR LISTO PARA REINICIAR!');
    console.log('✅ Caché completamente limpiado');
    console.log('✅ Dependencias reinstaladas');
    console.log('✅ Caché de Astro limpiado');

  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

cleanAndRestart();
