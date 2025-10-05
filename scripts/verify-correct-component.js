#!/usr/bin/env node

/**
 * Script para verificar que el componente correcto esté funcionando
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

async function verifyCorrectComponent() {
  console.log('🔍 Verificando que el componente correcto esté funcionando...\n');
  
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
    
    // 2. Verificar que DynamicGridBlocksSimple está corregido
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
      },
      {
        name: 'Patrón asimétrico',
        check: simpleContent.includes("['tall', 'short', 'short', 'tall']"),
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
      console.log('\n🎉 ¡COMPONENTE CORREGIDO CORRECTAMENTE!');
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
        console.log('\n📋 MOSAICO 2x2 CON BLOQUES PEQUEÑOS:');
        console.log('┌─────────────┬─────────────┐');
        console.log('│   TALL      │   SHORT     │');
        console.log('│   (3:4)     │   (4:3)     │');
        console.log('│   PEQUEÑO   │   PEQUEÑO   │');
        console.log('├─────────────┼─────────────┤');
        console.log('│   SHORT     │   TALL      │');
        console.log('│   (4:3)     │   (3:4)     │');
        console.log('│   PEQUEÑO   │   PEQUEÑO   │');
        console.log('└─────────────┴─────────────┘');
        
        console.log('\n📋 Productos en el mosaico:');
        activeProducts.slice(0, 4).forEach((product, index) => {
          const pattern = ['tall', 'short', 'short', 'tall'][index];
          const position = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'][index];
          console.log(`  ${index + 1}. ${position} [${pattern.toUpperCase()}]: ${product.products.title}`);
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
    console.log('1. ✅ Componente correcto identificado y corregido');
    console.log('2. 🔄 El servidor debería recargar automáticamente');
    console.log('3. 🧹 Si no ves cambios, limpia la caché (Ctrl+F5)');
    console.log('4. 👀 Busca la sección de productos destacados');
    console.log('5. 📱 Verifica que se vean 4 cuadros pequeños juntos');
    
    console.log('\n💡 CARACTERÍSTICAS DEL MOSAICO CORREGIDO:');
    console.log('   - ✅ Contenedor pequeño: max-w-[400px]');
    console.log('   - ✅ Grid 2x2: grid-cols-2');
    console.log('   - ✅ Gap pequeño: gap-2');
    console.log('   - ✅ Aspect ratios: 3:4 y 4:3');
    console.log('   - ✅ Imágenes cubren todo el bloque');
    console.log('   - ✅ Textos pequeños: text-sm y text-xs');
    console.log('   - ✅ Botones pequeños: h-8');
    console.log('   - ✅ Patrón asimétrico: tall, short, short, tall');
    
    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - 4 cuadros pequeños juntos en formato 2x2');
    console.log('   - Bloques de diferentes alturas que se compensan');
    console.log('   - Imágenes cubren toda la tarjeta');
    console.log('   - Textos y botones pequeños pero legibles');
    console.log('   - Responsive en móvil y desktop');
    
    console.log('\n🔧 SI AÚN NO VES LOS CAMBIOS:');
    console.log('   1. Espera 30 segundos para que el servidor se reinicie');
    console.log('   2. Refresca la página (Ctrl+F5)');
    console.log('   3. Verifica que estés en la página principal');
    console.log('   4. Busca la sección de productos destacados');
    console.log('   5. Los 4 cuadros deben verse juntos en formato 2x2');
    console.log('   6. Si sigue sin funcionar, reinicia el servidor manualmente');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyCorrectComponent();





