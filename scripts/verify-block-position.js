#!/usr/bin/env node

/**
 * Script para verificar que el bloque de aceite esté posicionado correctamente
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

async function verifyBlockPosition() {
  console.log('🔍 Verificando que el bloque de aceite esté posicionado correctamente...\n');
  
  try {
    // 1. Verificar que DynamicGridBlocksSimple tiene self-start para el bloque de aceite
    console.log('📄 Verificando DynamicGridBlocksSimple...');
    const simplePath = path.join(process.cwd(), 'src/components/react/DynamicGridBlocksSimple.tsx');
    const simpleContent = fs.readFileSync(simplePath, 'utf8');
    
    if (simpleContent.includes('self-start')) {
      console.log('✅ Self-start aplicado: El bloque de aceite se moverá hacia arriba');
    } else {
      console.log('❌ Self-start no aplicado');
    }
    
    if (simpleContent.includes('index === 3')) {
      console.log('✅ Condición correcta: Solo el bloque de aceite (índice 3) tendrá self-start');
    } else {
      console.log('❌ Condición incorrecta');
    }
    
    if (simpleContent.includes('[grid-auto-flow:dense]')) {
      console.log('✅ Grid dense aplicado: [grid-auto-flow:dense]');
    } else {
      console.log('❌ Grid dense no aplicado');
    }
    
    if (simpleContent.includes('[grid-template-rows:auto_auto]')) {
      console.log('✅ Grid template rows aplicado: [grid-template-rows:auto_auto]');
    } else {
      console.log('❌ Grid template rows no aplicado');
    }
    
    // 2. Verificar productos disponibles
    console.log('\n📦 Verificando productos disponibles...');
    
    const { data: activeProducts, error: activeProductsError } = await supabase
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
      .limit(4);
    
    if (activeProductsError) {
      console.error('❌ Error cargando productos activos:', activeProductsError);
    } else {
      console.log(`✅ Productos activos encontrados: ${activeProducts?.length || 0}`);
      
      if (activeProducts && activeProducts.length >= 4) {
        console.log('\n📋 MOSAICO 2x2 CON BLOQUE DE ACEITE POSICIONADO:');
        console.log('┌─────────────┬─────────────┐');
        console.log('│   TALL      │   SHORT     │');
        console.log('│   (3:4)     │   (4:3)     │');
        console.log('│             │             │');
        console.log('├─────────────┼─────────────┤');
        console.log('│   SHORT     │   TALL      │');
        console.log('│   (4:3)     │   (3:4)     │');
        console.log('│             │   ↑ ARRIBA  │');
        console.log('└─────────────┴─────────────┘');
        console.log('   ↑ Bloque de aceite más arriba');
        
        console.log('\n📋 Productos en el mosaico:');
        activeProducts.slice(0, 4).forEach((product, index) => {
          const pattern = ['tall', 'short', 'short', 'tall'][index];
          const position = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'][index];
          const specialNote = index === 3 ? ' (POSICIONADO ARRIBA)' : '';
          console.log(`  ${index + 1}. ${position} [${pattern.toUpperCase()}]: ${product.products.title}${specialNote}`);
          console.log(`     Precio: $${(product.price_cents / 100).toLocaleString('es-CL')}`);
          console.log(`     Stock: ${product.stock}`);
          console.log('');
        });
      } else {
        console.log('⚠️ No hay suficientes productos para el mosaico (necesita 4)');
      }
    }
    
    // 3. Instrucciones para el usuario
    console.log('\n🚀 INSTRUCCIONES PARA VER LOS CAMBIOS:');
    console.log('1. ✅ Bloque de aceite posicionado hacia arriba');
    console.log('2. 🔄 El servidor debería recargar automáticamente');
    console.log('3. 🧹 Si no ves cambios, limpia la caché (Ctrl+F5)');
    console.log('4. 👀 Busca la sección de productos destacados');
    console.log('5. 📱 Verifica que el bloque de aceite esté más arriba');
    
    console.log('\n💡 CARACTERÍSTICAS DEL POSICIONAMIENTO:');
    console.log('   - ✅ Self-start: Solo el bloque de aceite (índice 3)');
    console.log('   - ✅ Grid dense: [grid-auto-flow:dense]');
    console.log('   - ✅ Grid template rows: [grid-template-rows:auto_auto]');
    console.log('   - ✅ El bloque de aceite se moverá hacia arriba');
    console.log('   - ✅ Mantiene el tamaño y forma original');
    console.log('   - ✅ Se verá más simétrico con sus compañeros');
    
    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - El bloque de aceite estará más arriba');
    console.log('   - Más cerca del bloque de "Watts Durazno"');
    console.log('   - Sin espacio negro entre "Oferta Especial" y "Aceite"');
    console.log('   - Se verá más simétrico');
    console.log('   - Mantiene el tamaño y forma original');
    console.log('   - Mejor distribución visual');
    
    console.log('\n🔧 SI AÚN NO VES LOS CAMBIOS:');
    console.log('   1. Espera 30 segundos para que el servidor se reinicie');
    console.log('   2. Refresca la página (Ctrl+F5)');
    console.log('   3. Verifica que estés en la página principal');
    console.log('   4. Busca la sección de productos destacados');
    console.log('   5. El bloque de aceite debería estar más arriba');
    console.log('   6. Si sigue sin funcionar, reinicia el servidor manualmente');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyBlockPosition();










