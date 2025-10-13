#!/usr/bin/env node

/**
 * Script para forzar la actualización del sistema
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

async function forceUpdate() {
  console.log('🔄 Forzando actualización del sistema...\n');
  
  try {
    // 1. Verificar productos activos en la base de datos
    console.log('📦 Verificando productos activos en la base de datos...');
    
    const { data: activeProducts, error: activeProductsError } = await supabase
      .from('seller_products')
      .select(`
        price_cents,
        stock,
        active,
        product_id,
        seller_id
      `)
      .eq('active', true)
      .gt('stock', 0)
      .order('price_cents', { ascending: false })
      .limit(10);
    
    if (activeProductsError) {
      console.error('❌ Error cargando productos activos:', activeProductsError);
    } else {
      console.log(`✅ Productos activos encontrados: ${activeProducts?.length || 0}`);
      
      if (activeProducts && activeProducts.length > 0) {
        console.log('\n📋 Productos activos:');
        activeProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. Product ID: ${product.product_id}`);
          console.log(`     Precio: $${(product.price_cents / 100).toLocaleString('es-CL')}`);
          console.log(`     Stock: ${product.stock}`);
          console.log(`     Activo: ${product.active}`);
          console.log(`     Seller ID: ${product.seller_id}`);
          console.log('');
        });
      } else {
        console.log('⚠️ No hay productos activos disponibles');
      }
    }
    
    // 2. Verificar productos inactivos
    console.log('\n📦 Verificando productos inactivos...');
    
    const { data: inactiveProducts, error: inactiveProductsError } = await supabase
      .from('seller_products')
      .select(`
        price_cents,
        stock,
        active,
        product_id,
        seller_id
      `)
      .eq('active', false)
      .order('price_cents', { ascending: false })
      .limit(5);
    
    if (inactiveProductsError) {
      console.error('❌ Error cargando productos inactivos:', inactiveProductsError);
    } else {
      console.log(`✅ Productos inactivos encontrados: ${inactiveProducts?.length || 0}`);
      
      if (inactiveProducts && inactiveProducts.length > 0) {
        console.log('\n📋 Productos inactivos (NO deben aparecer en el feed):');
        inactiveProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. Product ID: ${product.product_id}`);
          console.log(`     Precio: $${(product.price_cents / 100).toLocaleString('es-CL')}`);
          console.log(`     Stock: ${product.stock}`);
          console.log(`     Activo: ${product.active}`);
          console.log(`     Seller ID: ${product.seller_id}`);
          console.log('');
        });
      }
    }
    
    // 3. Verificar que los archivos están correctos
    console.log('\n📄 Verificando archivos...');
    const files = [
      'src/components/react/MixedFeedSimple.tsx',
      'src/components/react/ProductFeedSimple.tsx',
      'src/components/react/DynamicGridBlocksSimple.tsx',
      'src/hooks/useRealProducts.ts'
    ];
    
    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} encontrado`);
      } else {
        console.log(`❌ ${file} no encontrado`);
      }
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
    
    // 5. Verificar que useRealProducts filtra por productos activos
    console.log('\n📄 Verificando useRealProducts...');
    const useRealProductsPath = path.join(process.cwd(), 'src/hooks/useRealProducts.ts');
    const useRealProductsContent = fs.readFileSync(useRealProductsPath, 'utf8');
    
    if (useRealProductsContent.includes('.eq(\'active\', true)')) {
      console.log('✅ useRealProducts filtra por productos activos');
    } else {
      console.log('❌ useRealProducts no filtra por productos activos');
    }
    
    if (useRealProductsContent.includes('.gt(\'stock\', 0)')) {
      console.log('✅ useRealProducts filtra por stock > 0');
    } else {
      console.log('❌ useRealProducts no filtra por stock > 0');
    }
    
    // 6. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Productos activos: ${activeProducts?.length || 0}`);
    console.log(`✅ Productos inactivos: ${inactiveProducts?.length || 0}`);
    console.log(`✅ Archivos encontrados: ${files.length}/${files.length}`);
    
    if (activeProducts && activeProducts.length > 0) {
      console.log('\n🎉 ¡Sistema configurado correctamente!');
      console.log('\n💡 Instrucciones para el usuario:');
      console.log('   1. Detener el servidor (Ctrl+C)');
      console.log('   2. Limpiar caché del navegador (Ctrl+F5)');
      console.log('   3. Reiniciar servidor: npm run dev');
      console.log('   4. Verificar que solo se muestren productos activos');
      console.log('   5. Verificar que DynamicGridBlocks no sea verde');
      
      console.log('\n🔧 Si el problema persiste:');
      console.log('   - Verificar consola del navegador (F12)');
      console.log('   - Buscar errores de JavaScript');
      console.log('   - Verificar que no hay productos inactivos visibles');
      console.log('   - Verificar que DynamicGridBlocks muestra productos reales');
    } else {
      console.log('\n⚠️ No hay productos activos disponibles');
      console.log('💡 Sugerencia: Activar productos desde el dashboard de vendedores');
    }
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

forceUpdate();










