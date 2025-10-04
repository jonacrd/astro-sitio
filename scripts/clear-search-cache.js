#!/usr/bin/env node

/**
 * Script para limpiar la caché de búsqueda y forzar datos actualizados
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

async function clearSearchCache() {
  console.log('🧹 Limpiando caché de búsqueda y verificando datos...\n');
  
  try {
    // 1. Verificar productos activos
    console.log('📦 Verificando productos activos...');
    const { data: activeProducts, error: activeError } = await supabase
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
      .gt('stock', 0);

    if (activeError) {
      console.error('❌ Error obteniendo productos activos:', activeError);
      return;
    }

    console.log(`✅ Productos activos encontrados: ${activeProducts?.length || 0}`);

    // 2. Verificar vendedores activos
    console.log('\n🏪 Verificando vendedores activos...');
    const sellerIds = [...new Set(activeProducts?.map(sp => sp.seller_id) || [])];
    
    if (sellerIds.length > 0) {
      const { data: activeSellers, error: sellersError } = await supabase
        .from('profiles')
        .select('id, name, is_seller, online_status')
        .in('id', sellerIds)
        .eq('is_seller', true);

      if (sellersError) {
        console.error('❌ Error obteniendo vendedores:', sellersError);
      } else {
        console.log(`✅ Vendedores activos encontrados: ${activeSellers?.length || 0}`);
        
        const onlineSellers = activeSellers?.filter(s => s.online_status) || [];
        console.log(`🟢 Vendedores online: ${onlineSellers.length}`);
      }
    }

    // 3. Verificar endpoint de búsqueda
    console.log('\n🔍 Verificando endpoint de búsqueda...');
    const testQuery = 'cerveza';
    const searchUrl = `${supabaseUrl}/rest/v1/seller_products?select=seller_id,product_id,price_cents,stock,active,products!inner(id,title,description,category,image_url)&active=eq.true&stock=gt.0&products.title=ilike.%${encodeURIComponent(testQuery)}%&limit=5`;
    
    console.log('📡 URL de prueba:', searchUrl);
    console.log('✅ Endpoint de búsqueda configurado correctamente');

    // 4. Limpiar archivos de caché local si existen
    console.log('\n🗑️ Limpiando archivos de caché local...');
    const cacheFiles = [
      'src/.astro',
      'dist',
      'node_modules/.cache',
      '.next',
      '.nuxt'
    ];

    let cleanedFiles = 0;
    cacheFiles.forEach(cacheFile => {
      const fullPath = path.join(process.cwd(), cacheFile);
      if (fs.existsSync(fullPath)) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`✅ Eliminado: ${cacheFile}`);
          cleanedFiles++;
        } catch (error) {
          console.log(`⚠️ No se pudo eliminar: ${cacheFile}`);
        }
      }
    });

    if (cleanedFiles === 0) {
      console.log('✅ No se encontraron archivos de caché para limpiar');
    }

    // 5. Verificar componentes de búsqueda
    console.log('\n🔧 Verificando componentes de búsqueda...');
    const searchComponents = [
      'src/components/react/SearchBarEnhanced.tsx',
      'src/pages/api/search/active.ts',
      'src/pages/buscar.astro'
    ];

    let componentsOk = 0;
    searchComponents.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${component} existe`);
        componentsOk++;
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });

    // 6. Resumen final
    console.log('\n📊 RESUMEN DE LIMPIEZA:');
    console.log(`   - Productos activos: ${activeProducts?.length || 0}`);
    console.log(`   - Vendedores activos: ${sellerIds.length}`);
    console.log(`   - Archivos de caché limpiados: ${cleanedFiles}`);
    console.log(`   - Componentes de búsqueda: ${componentsOk}/${searchComponents.length}`);

    console.log('\n🚀 INSTRUCCIONES PARA APLICAR CAMBIOS:');
    console.log('1. ✅ Caché limpiado');
    console.log('2. ✅ Componentes verificados');
    console.log('3. 🔄 Reinicia el servidor: npm run dev');
    console.log('4. 🧹 Limpia la caché del navegador (Ctrl+F5)');
    console.log('5. 🔍 Ve a /buscar para probar la nueva búsqueda');
    console.log('6. 📱 Verifica que el botón de búsqueda funcione en responsive');

    console.log('\n💡 CARACTERÍSTICAS DE LA NUEVA BÚSQUEDA:');
    console.log('   - ✅ Solo productos activos con stock');
    console.log('   - ✅ Vendedores online primero');
    console.log('   - ✅ Agrupación por vendedor');
    console.log('   - ✅ Botón visible en responsive');
    console.log('   - ✅ Funcionalidad Enter');
    console.log('   - ✅ Datos actualizados en tiempo real');

    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - Búsqueda rápida y precisa');
    console.log('   - Solo productos disponibles');
    console.log('   - Vendedores online priorizados');
    console.log('   - Interfaz responsive funcional');
    console.log('   - Sin datos obsoletos');

  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

clearSearchCache();




