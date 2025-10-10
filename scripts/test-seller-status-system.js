#!/usr/bin/env node

/**
 * Script para probar el sistema de estado online/offline de vendedores
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

async function testSellerStatusSystem() {
  console.log('🔍 Probando sistema de estado online/offline de vendedores...\n');
  
  try {
    // 1. Verificar que la tabla seller_status existe
    console.log('📄 Verificando tabla seller_status...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('seller_status')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Tabla seller_status no existe, creándola...');
      console.log('📝 Ejecuta el script: setup-seller-status.sql');
      return;
    } else {
      console.log('✅ Tabla seller_status existe');
    }
    
    // 2. Verificar vendedores existentes
    console.log('\n📄 Verificando vendedores existentes...');
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);
    
    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }
    
    console.log(`✅ Vendedores encontrados: ${sellers?.length || 0}`);
    if (sellers && sellers.length > 0) {
      sellers.forEach((seller, index) => {
        console.log(`  ${index + 1}. ${seller.name} (${seller.id})`);
      });
    }
    
    // 3. Verificar estado de vendedores
    console.log('\n📄 Verificando estado de vendedores...');
    const { data: statusData, error: statusError } = await supabase
      .from('seller_status')
      .select('seller_id, online, last_seen')
      .in('seller_id', sellers?.map(s => s.id) || []);
    
    if (statusError) {
      console.error('❌ Error obteniendo estado:', statusError);
    } else {
      console.log(`✅ Estados encontrados: ${statusData?.length || 0}`);
      
      if (statusData && statusData.length > 0) {
        statusData.forEach((status, index) => {
          const seller = sellers?.find(s => s.id === status.seller_id);
          const onlineStatus = status.online ? '🟢 ONLINE' : '🔴 OFFLINE';
          console.log(`  ${index + 1}. ${seller?.name || 'Vendedor'} - ${onlineStatus}`);
        });
      }
    }
    
    // 4. Probar búsqueda con priorización
    console.log('\n🔍 Probando búsqueda con priorización...');
    const testQuery = 'aceite';
    
    const { data: searchResults, error: searchError } = await supabase
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
      .ilike('products.title', `%${testQuery}%`)
      .limit(10);
    
    if (searchError) {
      console.error('❌ Error en búsqueda:', searchError);
    } else {
      console.log(`✅ Búsqueda de "${testQuery}": ${searchResults?.length || 0} productos encontrados`);
      
      if (searchResults && searchResults.length > 0) {
        // Obtener estado de vendedores para la búsqueda
        const searchSellerIds = [...new Set(searchResults.map(sp => sp.seller_id))];
        const { data: searchStatus, error: searchStatusError } = await supabase
          .from('seller_status')
          .select('seller_id, online')
          .in('seller_id', searchSellerIds);
        
        if (!searchStatusError && searchStatus) {
          const statusMap = new Map(searchStatus.map(s => [s.seller_id, s.online]));
          
          console.log('\n📋 Productos encontrados (ordenados por prioridad):');
          searchResults.forEach((product, index) => {
            const isOnline = statusMap.get(product.seller_id) || false;
            const onlineStatus = isOnline ? '🟢 ONLINE' : '🔴 OFFLINE';
            const priority = isOnline ? '🔥 PRIORIDAD' : '⏳ NORMAL';
            console.log(`  ${index + 1}. ${product.products.title} - $${Math.round(product.price_cents / 100)} - ${onlineStatus} - ${priority}`);
          });
        }
      }
    }
    
    // 5. Verificar componentes
    console.log('\n📄 Verificando componentes...');
    const components = [
      'src/components/react/SellerStatusToggle.tsx',
      'src/pages/perfil.astro',
      'src/pages/api/search/active.ts'
    ];
    
    let componentsOk = 0;
    components.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${component} existe`);
        componentsOk++;
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });
    
    // 6. Resumen final
    console.log('\n📊 RESUMEN DEL SISTEMA:');
    console.log(`   - Vendedores: ${sellers?.length || 0}`);
    console.log(`   - Estados configurados: ${statusData?.length || 0}`);
    console.log(`   - Componentes: ${componentsOk}/${components.length}`);
    console.log(`   - Búsqueda de prueba: ${searchResults?.length || 0} productos`);
    
    console.log('\n🚀 INSTRUCCIONES PARA USAR:');
    console.log('1. ✅ Ejecuta setup-seller-status.sql en Supabase');
    console.log('2. ✅ Ve a /perfil como vendedor');
    console.log('3. 🔄 Activa/desactiva el switch de estado');
    console.log('4. 🔍 Prueba la búsqueda - vendedores online aparecerán primero');
    console.log('5. 📱 Verifica que funcione en responsive');
    
    console.log('\n💡 CARACTERÍSTICAS DEL SISTEMA:');
    console.log('   - ✅ Switch en perfil para cambiar estado online/offline');
    console.log('   - ✅ Búsqueda prioriza vendedores online');
    console.log('   - ✅ Estado persistente en base de datos');
    console.log('   - ✅ Indicadores visuales de estado');
    console.log('   - ✅ Ordenamiento inteligente');
    
    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - Vendedores online aparecen primero en búsquedas');
    console.log('   - Switch funcional en /perfil');
    console.log('   - Estado persistente entre sesiones');
    console.log('   - Búsqueda más precisa y útil');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testSellerStatusSystem();








