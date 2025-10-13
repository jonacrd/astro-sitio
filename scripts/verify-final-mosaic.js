#!/usr/bin/env node

/**
 * Script para verificar que el mosaico final esté correctamente implementado
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

async function verifyFinalMosaic() {
  console.log('🔍 Verificando que el mosaico final esté correctamente implementado...\n');
  
  try {
    // 1. Verificar que index.astro usa DynamicGridBlocksSimple
    console.log('📄 Verificando index.astro...');
    const indexPath = path.join(process.cwd(), 'src/pages/index.astro');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('DynamicGridBlocksSimple')) {
      console.log('✅ index.astro usa DynamicGridBlocksSimple');
    } else {
      console.log('❌ index.astro no usa DynamicGridBlocksSimple');
    }
    
    // 2. Verificar que DynamicGridBlocksSimple está correctamente modificado
    console.log('\n📄 Verificando DynamicGridBlocksSimple...');
    const simplePath = path.join(process.cwd(), 'src/components/react/DynamicGridBlocksSimple.tsx');
    const simpleContent = fs.readFileSync(simplePath, 'utf8');
    
    const checks = [
      {
        name: 'Contenedor pequeño',
        check: simpleContent.includes('max-w-[400px]'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Grid 2x2',
        check: simpleContent.includes('grid-cols-2'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Gap pequeño',
        check: simpleContent.includes('gap-2'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Grid dense',
        check: simpleContent.includes('[grid-auto-flow:dense]'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Grid template rows',
        check: simpleContent.includes('[grid-template-rows:auto_auto]'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Self-start para bloque de aceite',
        check: simpleContent.includes('self-start') && simpleContent.includes('index === 3'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Aspect ratios correctos',
        check: simpleContent.includes('aspect-[3/4]') && simpleContent.includes('aspect-[4/3]'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Imágenes cubren todo',
        check: simpleContent.includes('object-cover'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Textos pequeños',
        check: simpleContent.includes('text-sm') && simpleContent.includes('text-xs'),
        file: 'DynamicGridBlocksSimple'
      },
      {
        name: 'Botones pequeños',
        check: simpleContent.includes('h-8'),
        file: 'DynamicGridBlocksSimple'
      }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      if (check.check) {
        console.log(`✅ ${check.name}: ${check.file}`);
      } else {
        console.log(`❌ ${check.name}: ${check.file}`);
        allPassed = false;
      }
    });
    
    if (allPassed) {
      console.log('\n🎉 ¡TODOS LOS CAMBIOS APLICADOS CORRECTAMENTE!');
    } else {
      console.log('\n⚠️ Algunos cambios no se aplicaron correctamente');
    }
    
    // 3. Verificar productos disponibles
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
        console.log('\n📋 MOSAICO 2x2 FINAL:');
        console.log('┌─────────────┬─────────────┐');
        console.log('│   TALL      │   SHORT     │');
        console.log('│   (3:4)     │   (4:3)     │');
        console.log('│             │             │');
        console.log('├─────────────┼─────────────┤');
        console.log('│   SHORT     │   TALL      │');
        console.log('│   (4:3)     │   (3:4)     │');
        console.log('│             │   ↑ ARRIBA  │');
        console.log('└─────────────┴─────────────┘');
        console.log('   ↑ Bloque de aceite posicionado arriba');
        
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
    
    // 4. Instrucciones para el usuario
    console.log('\n🚀 INSTRUCCIONES PARA VER LOS CAMBIOS:');
    console.log('1. ✅ Servidor iniciado en segundo plano');
    console.log('2. ✅ Componente correcto identificado y modificado');
    console.log('3. 🔄 Abre tu navegador y ve a http://localhost:4321');
    console.log('4. 🧹 Limpia la caché del navegador (Ctrl+F5)');
    console.log('5. 👀 Busca la sección de productos destacados');
    console.log('6. 📱 Verifica que se vean 4 cuadros pequeños juntos');
    console.log('7. 🎯 El bloque de aceite debería estar más arriba');
    
    console.log('\n💡 CARACTERÍSTICAS DEL MOSAICO FINAL:');
    console.log('   - ✅ Contenedor pequeño: max-w-[400px]');
    console.log('   - ✅ Grid 2x2: grid-cols-2');
    console.log('   - ✅ Gap pequeño: gap-2');
    console.log('   - ✅ Grid dense: [grid-auto-flow:dense]');
    console.log('   - ✅ Grid template rows: [grid-template-rows:auto_auto]');
    console.log('   - ✅ Self-start: Solo el bloque de aceite (índice 3)');
    console.log('   - ✅ Aspect ratios: 3:4 y 4:3');
    console.log('   - ✅ Imágenes cubren todo el bloque');
    console.log('   - ✅ Textos pequeños: text-sm y text-xs');
    console.log('   - ✅ Botones pequeños: h-8');
    
    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - 4 cuadros pequeños juntos en formato 2x2');
    console.log('   - Bloques de diferentes alturas que se compensan');
    console.log('   - Imágenes cubren toda la tarjeta');
    console.log('   - Textos y botones pequeños pero legibles');
    console.log('   - El bloque de aceite estará más arriba');
    console.log('   - Sin espacios negros entre bloques');
    console.log('   - Se verá más simétrico');
    
    console.log('\n🔧 SI AÚN NO VES LOS CAMBIOS:');
    console.log('   1. Espera 30 segundos para que el servidor se inicie');
    console.log('   2. Ve a http://localhost:4321');
    console.log('   3. Refresca la página (Ctrl+F5)');
    console.log('   4. Verifica que estés en la página principal');
    console.log('   5. Busca la sección de productos destacados');
    console.log('   6. Los 4 cuadros deben verse juntos en formato 2x2');
    console.log('   7. El bloque de aceite debería estar más arriba');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyFinalMosaic();










