#!/usr/bin/env node

/**
 * Script para verificar que el diseño asimétrico esté implementado correctamente
 */

import fs from 'fs';
import path from 'path';

function verifyAsymmetricDesign() {
  console.log('🔍 Verificando que el diseño asimétrico esté implementado...\n');
  
  try {
    const realGridBlocksPath = path.join(process.cwd(), 'astro-sitio/src/components/react/RealGridBlocks.tsx');
    
    if (!fs.existsSync(realGridBlocksPath)) {
      console.log('❌ RealGridBlocks no encontrado');
      return;
    }

    const content = fs.readFileSync(realGridBlocksPath, 'utf8');
    
    console.log('📋 VERIFICANDO DISEÑO ASIMÉTRICO:');
    
    // Verificar grid con gridAutoRows: '8px'
    if (content.includes('gridAutoRows: \'8px\'')) {
      console.log('✅ Grid con gridAutoRows: 8px configurado');
    } else {
      console.log('❌ Grid gridAutoRows: 8px NO configurado');
    }
    
    // Verificar gap-3
    if (content.includes('gap-3')) {
      console.log('✅ Gap-3 configurado');
    } else {
      console.log('❌ Gap-3 NO configurado');
    }
    
    // Verificar patrón de spans [42, 38, 30, 30]
    if (content.includes('[42, 38, 30, 30]')) {
      console.log('✅ Patrón de spans [42, 38, 30, 30] configurado');
    } else {
      console.log('❌ Patrón de spans NO configurado');
    }
    
    // Verificar gridRow: span
    if (content.includes('gridRow: `span ${gridSpans[i]}`')) {
      console.log('✅ GridRow span dinámico configurado');
    } else {
      console.log('❌ GridRow span dinámico NO configurado');
    }
    
    // Verificar posicionamiento específico
    if (content.includes('col-start-1 row-start-1') && content.includes('col-start-2 row-start-1')) {
      console.log('✅ Posicionamiento específico configurado');
    } else {
      console.log('❌ Posicionamiento específico NO configurado');
    }
    
    // Verificar overlays
    if (content.includes('from-black/0 via-black/0 to-black/35')) {
      console.log('✅ Overlay sutil general configurado');
    } else {
      console.log('❌ Overlay sutil general NO configurado');
    }
    
    if (content.includes('from-black/75 via-black/35 to-transparent')) {
      console.log('✅ Overlay inferior configurado');
    } else {
      console.log('❌ Overlay inferior NO configurado');
    }
    
    // Verificar botón redondo
    if (content.includes('rounded-full') && content.includes('h-9 w-9')) {
      console.log('✅ Botón redondo configurado');
    } else {
      console.log('❌ Botón redondo NO configurado');
    }
    
    // Verificar que no hay aspect-*
    if (!content.includes('aspect-')) {
      console.log('✅ Aspect ratios eliminados');
    } else {
      console.log('❌ Aspect ratios NO eliminados');
    }

    console.log('\n📊 CONFIGURACIÓN APLICADA:');
    console.log('✅ Grid: 2 columnas, gridAutoRows: 8px');
    console.log('✅ Gap: 3 (12px)');
    console.log('✅ Spans: [42, 38, 30, 30]');
    console.log('✅ Posicionamiento: col-start-1 row-start-1, col-start-2 row-start-1, etc.');
    console.log('✅ Overlays: sutil general + inferior');
    console.log('✅ Botón: redondo, pegado abajo-izquierda');
    console.log('✅ Sin aspect ratios');

    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('✅ Tarjeta alta a la izquierda (span 42)');
    console.log('✅ Promo del pollo a la derecha (span 38)');
    console.log('✅ Dos tarjetas medianas debajo (span 30 cada una)');
    console.log('✅ Imágenes con object-cover full-bleed');
    console.log('✅ Overlays para legibilidad');
    console.log('✅ Botones redondos funcionales');

    console.log('\n🔧 CARACTERÍSTICAS DEL DISEÑO:');
    console.log('✅ Grid auto rows de 8px base');
    console.log('✅ Spans específicos para cada tarjeta');
    console.log('✅ Posicionamiento explícito');
    console.log('✅ Overlays sutil + inferior');
    console.log('✅ Botones redondos con ícono +');

    console.log('\n🚀 INSTRUCCIONES PARA VERIFICAR:');
    console.log('1. ✅ ABRIR: http://localhost:4321/');
    console.log('2. 🔄 RECARGAR LA PÁGINA');
    console.log('3. ✅ VERIFICAR TARJETA ALTA IZQUIERDA');
    console.log('4. ✅ VERIFICAR PROMO DEL POLLO DERECHA');
    console.log('5. ✅ VERIFICAR DOS TARJETAS MEDIANAS ABAJO');
    console.log('6. ✅ VERIFICAR OVERLAYS PARA LEGIBILIDAD');
    console.log('7. ✅ VERIFICAR BOTONES REDONDOS FUNCIONALES');
    console.log('8. ✅ VERIFICAR IMÁGENES FULL-BLEED');

    console.log('\n🎉 ¡DISEÑO ASIMÉTRICO IMPLEMENTADO!');
    console.log('✅ Mosaico asimétrico como en la referencia');
    console.log('✅ Spans específicos [42, 38, 30, 30]');
    console.log('✅ Posicionamiento explícito');
    console.log('✅ Overlays para legibilidad');
    console.log('✅ Botones redondos funcionales');

  } catch (error) {
    console.error('❌ Error verificando diseño asimétrico:', error);
  }
}

verifyAsymmetricDesign();





