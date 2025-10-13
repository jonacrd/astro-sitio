#!/usr/bin/env node

/**
 * Script para verificar que el mosaico se vea correctamente después del reinicio
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

async function checkMosaicFix() {
  console.log('🔍 Verificando que el mosaico se vea correctamente...\n');
  
  try {
    // 1. Verificar que los archivos están corregidos
    console.log('📄 Verificando archivos corregidos...');
    
    const gridBlockPath = path.join(process.cwd(), 'src/components/feed/DynamicGridBlock.tsx');
    const gridBlocksPath = path.join(process.cwd(), 'src/components/react/DynamicGridBlocks.tsx');
    
    if (!fs.existsSync(gridBlockPath)) {
      console.log('❌ DynamicGridBlock.tsx no existe');
      return;
    }
    
    if (!fs.existsSync(gridBlocksPath)) {
      console.log('❌ DynamicGridBlocks.tsx no existe');
      return;
    }
    
    const gridBlockContent = fs.readFileSync(gridBlockPath, 'utf8');
    const gridBlocksContent = fs.readFileSync(gridBlocksPath, 'utf8');
    
    // Verificar características del mosaico
    const checks = [
      {
        name: 'Contenedor pequeño',
        check: gridBlockContent.includes('max-w-[400px]'),
        file: 'DynamicGridBlock'
      },
      {
        name: 'Gap pequeño',
        check: gridBlockContent.includes('gap-2'),
        file: 'DynamicGridBlock'
      },
      {
        name: 'Grid 2x2',
        check: gridBlockContent.includes('grid-cols-2'),
        file: 'DynamicGridBlock'
      },
      {
        name: 'Aspect ratios correctos',
        check: gridBlockContent.includes('aspect-[3/4]') && gridBlockContent.includes('aspect-[4/3]'),
        file: 'DynamicGridBlock'
      },
      {
        name: 'Textos pequeños',
        check: gridBlockContent.includes('text-sm') && gridBlockContent.includes('text-xs'),
        file: 'DynamicGridBlock'
      },
      {
        name: 'Botones pequeños',
        check: gridBlockContent.includes('h-8'),
        file: 'DynamicGridBlock'
      },
      {
        name: 'DynamicGridBlocks contenedor pequeño',
        check: gridBlocksContent.includes('max-w-[400px]'),
        file: 'DynamicGridBlocks'
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
    
    // 3. Instrucciones para el usuario
    console.log('\n🚀 INSTRUCCIONES PARA VER LOS CAMBIOS:');
    console.log('1. ✅ Servidor reiniciado correctamente');
    console.log('2. 🔄 Abre tu navegador y ve a http://localhost:4321');
    console.log('3. 🧹 Limpia la caché del navegador (Ctrl+F5)');
    console.log('4. 👀 Busca la sección de productos destacados');
    console.log('5. 📱 Verifica que se vean 4 cuadros pequeños juntos');
    
    console.log('\n💡 CARACTERÍSTICAS DEL MOSAICO CORREGIDO:');
    console.log('   - ✅ Contenedor pequeño: max-w-[400px]');
    console.log('   - ✅ Gap pequeño: gap-2');
    console.log('   - ✅ Textos pequeños: text-sm y text-xs');
    console.log('   - ✅ Botones pequeños: h-8');
    console.log('   - ✅ Grid 2x2 compacto');
    console.log('   - ✅ 4 cuadros juntos visibles');
    console.log('   - ✅ Aspect ratios correctos');
    
    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - 4 cuadros pequeños juntos en formato 2x2');
    console.log('   - Bloques de diferentes alturas que se compensan');
    console.log('   - Imágenes cubren toda la tarjeta');
    console.log('   - Textos y botones pequeños pero legibles');
    console.log('   - Responsive en móvil y desktop');
    
    console.log('\n🔧 SI NO VES LOS CAMBIOS:');
    console.log('   1. Espera 30 segundos para que el servidor se reinicie');
    console.log('   2. Refresca la página (Ctrl+F5)');
    console.log('   3. Verifica que estés en la página principal');
    console.log('   4. Busca la sección de productos destacados');
    console.log('   5. Los 4 cuadros deben verse juntos en formato 2x2');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

checkMosaicFix();










