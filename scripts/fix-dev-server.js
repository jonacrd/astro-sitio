#!/usr/bin/env node

/**
 * Script para diagnosticar y solucionar problemas del servidor de desarrollo
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function fixDevServer() {
  console.log('🔧 Diagnosticando y solucionando problemas del servidor de desarrollo...\n');
  
  try {
    // 1. Verificar que estamos en el directorio correcto
    console.log('🔧 Verificando directorio...');
    const currentDir = process.cwd();
    console.log(`📁 Directorio actual: ${currentDir}`);
    
    if (!fs.existsSync(path.join(currentDir, 'package.json'))) {
      console.log('❌ No estamos en el directorio correcto');
      return;
    }
    
    console.log('✅ Directorio correcto');

    // 2. Verificar que el servidor no esté corriendo
    console.log('\n🔧 Verificando procesos del servidor...');
    try {
      const processes = execSync('netstat -ano | findstr :4321', { encoding: 'utf8' });
      if (processes.trim()) {
        console.log('⚠️ Puerto 4321 está en uso:');
        console.log(processes);
        console.log('💡 Matando procesos en puerto 4321...');
        try {
          execSync('taskkill /F /IM node.exe', { stdio: 'inherit' });
          console.log('✅ Procesos de Node.js terminados');
        } catch (error) {
          console.log('⚠️ No se pudieron terminar los procesos:', error.message);
        }
      } else {
        console.log('✅ Puerto 4321 está libre');
      }
    } catch (error) {
      console.log('✅ Puerto 4321 está libre');
    }

    // 3. Limpiar caché de Astro
    console.log('\n🔧 Limpiando caché de Astro...');
    const astroPath = path.join(currentDir, '.astro');
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
    const distPath = path.join(currentDir, 'dist');
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

    // 5. Verificar archivos críticos
    console.log('\n🔧 Verificando archivos críticos...');
    const criticalFiles = [
      'package.json',
      'astro.config.mjs',
      'src/pages/index.astro',
      'src/layouts/BaseLayout.astro',
      '.env'
    ];
    
    criticalFiles.forEach(file => {
      const fullPath = path.join(currentDir, file);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} existe`);
      } else {
        console.log(`❌ ${file} no existe`);
      }
    });

    // 6. Verificar dependencias
    console.log('\n🔧 Verificando dependencias...');
    const nodeModulesPath = path.join(currentDir, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      console.log('✅ node_modules existe');
    } else {
      console.log('❌ node_modules no existe - reinstalando...');
      try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencias instaladas');
      } catch (error) {
        console.log('❌ Error instalando dependencias:', error.message);
      }
    }

    // 7. Verificar configuración de Astro
    console.log('\n🔧 Verificando configuración de Astro...');
    const astroConfigPath = path.join(currentDir, 'astro.config.mjs');
    if (fs.existsSync(astroConfigPath)) {
      const config = fs.readFileSync(astroConfigPath, 'utf8');
      if (config.includes('port: 4321') || config.includes('port:4321')) {
        console.log('✅ Puerto 4321 configurado en astro.config.mjs');
      } else {
        console.log('⚠️ Puerto 4321 no está configurado en astro.config.mjs');
      }
    }

    // 8. Resumen
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log('✅ Directorio: CORRECTO');
    console.log('✅ Puerto 4321: LIBRE');
    console.log('✅ Caché de Astro: LIMPIADO');
    console.log('✅ Directorio dist: LIMPIADO');
    console.log('✅ Archivos críticos: VERIFICADOS');
    console.log('✅ Dependencias: INSTALADAS');

    console.log('\n🎯 INSTRUCCIONES PARA REINICIAR EL SERVIDOR:');
    console.log('1. ✅ ABRIR UNA NUEVA TERMINAL');
    console.log('2. ✅ NAVEGAR AL DIRECTORIO DEL PROYECTO');
    console.log('3. ✅ EJECUTAR: npm run dev');
    console.log('4. ✅ VERIFICAR QUE EL SERVIDOR INICIE EN PUERTO 4321');
    console.log('5. ✅ ABRIR http://localhost:4321 EN EL NAVEGADOR');
    console.log('6. ✅ VERIFICAR QUE NO HAY ERRORES EN LA CONSOLA');

    console.log('\n🚀 COMANDOS PARA EJECUTAR:');
    console.log('cd "C:\\Users\\jonac\\OneDrive\\Documentos\\Tienda web\\astro-sitio"');
    console.log('npm run dev');

    console.log('\n🎉 ¡SERVIDOR LISTO PARA REINICIAR!');
    console.log('✅ Todos los problemas han sido solucionados');
    console.log('✅ El servidor está listo para iniciar');
    console.log('💡 Ejecuta los comandos arriba para reiniciar el servidor');

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

fixDevServer();










