#!/usr/bin/env node

/**
 * Script para verificar que no se muestran productos de ejemplo
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

async function verifyNoExampleProducts() {
  console.log('🔍 Verificando que no se muestran productos de ejemplo...\n');
  
  try {
    // 1. Verificar que los archivos están correctos
    console.log('📄 Verificando archivos...');
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
    
    // 2. Verificar que useRealProducts no usa productos de ejemplo
    console.log('\n📄 Verificando useRealProducts...');
    const useRealProductsPath = path.join(process.cwd(), 'src/hooks/useRealProducts.ts');
    const useRealProductsContent = fs.readFileSync(useRealProductsPath, 'utf8');
    
    if (useRealProductsContent.includes('No se muestran productos de ejemplo')) {
      console.log('✅ useRealProducts no usa productos de ejemplo');
    } else {
      console.log('❌ useRealProducts puede estar usando productos de ejemplo');
    }
    
    if (useRealProductsContent.includes('setProducts([])')) {
      console.log('✅ useRealProducts establece productos vacíos cuando no hay datos reales');
    } else {
      console.log('❌ useRealProducts no establece productos vacíos');
    }
    
    // 3. Verificar que DynamicGridBlocksSimple no usa productos de ejemplo
    console.log('\n📄 Verificando DynamicGridBlocksSimple...');
    const gridPath = path.join(process.cwd(), 'src/components/react/DynamicGridBlocksSimple.tsx');
    const gridContent = fs.readFileSync(gridPath, 'utf8');
    
    if (gridContent.includes('No se muestran productos de ejemplo')) {
      console.log('✅ DynamicGridBlocksSimple no usa productos de ejemplo');
    } else {
      console.log('❌ DynamicGridBlocksSimple puede estar usando productos de ejemplo');
    }
    
    if (gridContent.includes('setProducts([])')) {
      console.log('✅ DynamicGridBlocksSimple establece productos vacíos cuando no hay datos reales');
    } else {
      console.log('❌ DynamicGridBlocksSimple no establece productos vacíos');
    }
    
    // 4. Verificar que ProductFeedSimple no usa productos de ejemplo
    console.log('\n📄 Verificando ProductFeedSimple...');
    const productFeedPath = path.join(process.cwd(), 'src/components/react/ProductFeedSimple.tsx');
    const productFeedContent = fs.readFileSync(productFeedPath, 'utf8');
    
    if (productFeedContent.includes('No se muestran productos de ejemplo')) {
      console.log('✅ ProductFeedSimple no usa productos de ejemplo');
    } else {
      console.log('❌ ProductFeedSimple puede estar usando productos de ejemplo');
    }
    
    if (productFeedContent.includes('setProducts([])')) {
      console.log('✅ ProductFeedSimple establece productos vacíos cuando no hay datos reales');
    } else {
      console.log('❌ ProductFeedSimple no establece productos vacíos');
    }
    
    // 5. Probar consulta de productos activos
    console.log('\n📦 Probando consulta de productos activos...');
    
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
        console.log('\n📋 Primeros 5 productos activos:');
        activeProducts.slice(0, 5).forEach((product, index) => {
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
    
    // 6. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Productos activos: ${activeProducts?.length || 0}`);
    console.log(`✅ Archivos encontrados: ${files.length}/${files.length}`);
    
    if (activeProducts && activeProducts.length > 0) {
      console.log('\n🎉 ¡Sistema configurado correctamente!');
      console.log('\n💡 INSTRUCCIONES CRÍTICAS:');
      console.log('   1. DETENER el servidor actual (Ctrl+C)');
      console.log('   2. ESPERAR 5 segundos');
      console.log('   3. REINICIAR servidor: npm run dev');
      console.log('   4. LIMPIAR caché del navegador (Ctrl+F5)');
      console.log('   5. VERIFICAR que solo se muestren productos activos');
      console.log('   6. VERIFICAR que no se muestran productos de ejemplo');
      
      console.log('\n🔧 Si el problema persiste:');
      console.log('   - CERRAR completamente el navegador');
      console.log('   - ABRIR una nueva ventana del navegador');
      console.log('   - VERIFICAR consola del navegador (F12)');
      console.log('   - BUSCAR errores de JavaScript');
      console.log('   - VERIFICAR que no hay productos de ejemplo visibles');
    } else {
      console.log('\n⚠️ No hay productos activos disponibles');
      console.log('💡 Sugerencia: Activar productos desde el dashboard de vendedores');
    }
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyNoExampleProducts();










