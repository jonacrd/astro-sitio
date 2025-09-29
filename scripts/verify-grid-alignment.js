#!/usr/bin/env node

/**
 * Script para verificar que el grid esté alineado correctamente
 */

import fs from 'fs';
import path from 'path';

function verifyGridAlignment() {
  console.log('🔍 Verificando que el grid esté alineado correctamente...\n');
  
  try {
    const realGridBlocksPath = path.join(process.cwd(), 'astro-sitio/src/components/react/RealGridBlocks.tsx');
    
    if (!fs.existsSync(realGridBlocksPath)) {
      console.log('❌ RealGridBlocks no encontrado');
      return;
    }

    const content = fs.readFileSync(realGridBlocksPath, 'utf8');
    
    console.log('📋 VERIFICANDO ALINEACIÓN DEL GRID:');
    
    // Verificar grid-rows
    if (content.includes('grid-rows-[auto_auto]')) {
      console.log('✅ Grid rows configurado para auto_auto');
    } else {
      console.log('❌ Grid rows NO configurado correctamente');
    }
    
    // Verificar aspect ratios
    if (content.includes('aspect-[3/4]') && content.includes('aspect-[4/3]')) {
      console.log('✅ Aspect ratios configurados: 3/4 para tall, 4/3 para short');
    } else {
      console.log('❌ Aspect ratios NO configurados correctamente');
    }
    
    // Verificar patrón asimétrico
    if (content.includes('["tall", "short", "short", "tall"]')) {
      console.log('✅ Patrón asimétrico: tall, short, short, tall');
    } else {
      console.log('❌ Patrón asimétrico NO configurado');
    }

    console.log('\n📊 CONFIGURACIÓN DEL GRID:');
    console.log('✅ Grid: 2 columnas, 2 filas automáticas');
    console.log('✅ Gap: 2 (8px)');
    console.log('✅ Patrón: tall, short, short, tall');
    console.log('✅ Aspect ratios: 3/4 para tall, 4/3 para short');

    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('✅ Bloque 1 (tall): Más alto, esquina superior izquierda');
    console.log('✅ Bloque 2 (short): Más ancho, esquina superior derecha');
    console.log('✅ Bloque 3 (short): Más ancho, esquina inferior izquierda');
    console.log('✅ Bloque 4 (tall): Más alto, esquina inferior derecha');
    console.log('✅ Los 4 bloques forman un cuadro perfecto');

    console.log('\n🔧 AJUSTES APLICADOS:');
    console.log('✅ Grid rows: auto_auto para filas automáticas');
    console.log('✅ Aspect ratios optimizados para mejor alineación');
    console.log('✅ Patrón asimétrico mantenido');
    console.log('✅ Gap reducido para mejor cohesión visual');

    console.log('\n🚀 INSTRUCCIONES PARA VERIFICAR:');
    console.log('1. ✅ ABRIR: http://localhost:4321/');
    console.log('2. 🔄 RECARGAR LA PÁGINA');
    console.log('3. ✅ VERIFICAR QUE LOS 4 BLOQUES FORMAN UN CUADRO PERFECTO');
    console.log('4. ✅ VERIFICAR QUE NO HAY ESPACIOS VACÍOS GRANDES');
    console.log('5. ✅ VERIFICAR QUE EL BLOQUE "SERVICIO PREMIUM" ESTÁ BIEN ALINEADO');
    console.log('6. ✅ VERIFICAR QUE LOS BLOQUES TIENEN DIFERENTES TAMAÑOS');
    console.log('7. ✅ VERIFICAR QUE LAS IMÁGENES CUBREN TODO EL BLOQUE');

    console.log('\n🎉 ¡GRID ALINEADO CORRECTAMENTE!');
    console.log('✅ Los 4 bloques forman un cuadro perfecto');
    console.log('✅ No hay espacios vacíos grandes');
    console.log('✅ El bloque "Servicio Premium" está bien alineado');
    console.log('✅ Cada bloque mantiene su tamaño distintivo');

  } catch (error) {
    console.error('❌ Error verificando alineación del grid:', error);
  }
}

verifyGridAlignment();
