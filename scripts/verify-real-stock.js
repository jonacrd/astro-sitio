#!/usr/bin/env node

/**
 * Script para verificar el stock real de productos y limpiar datos incorrectos
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

async function verifyRealStock() {
  console.log('🔍 Verificando stock real de productos...\n');
  
  try {
    // 1. Verificar todos los productos en seller_products
    console.log('📊 Verificando todos los productos en seller_products...');
    const { data: allProducts, error: allError } = await supabase
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
          category
        )
      `)
      .limit(100);

    if (allError) {
      console.error('❌ Error obteniendo productos:', allError);
      return;
    }

    console.log(`📦 Total productos en seller_products: ${allProducts?.length || 0}`);

    // 2. Verificar productos activos con stock
    console.log('\n✅ Verificando productos activos con stock...');
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
          category
        )
      `)
      .eq('active', true)
      .gt('stock', 0);

    if (activeError) {
      console.error('❌ Error obteniendo productos activos:', activeError);
      return;
    }

    console.log(`🟢 Productos activos con stock: ${activeProducts?.length || 0}`);

    // 3. Verificar vendedores
    console.log('\n👥 Verificando vendedores...');
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);

    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }

    console.log(`👤 Vendedores registrados: ${sellers?.length || 0}`);

    // 4. Mostrar productos por vendedor
    if (activeProducts && activeProducts.length > 0) {
      console.log('\n📋 PRODUCTOS ACTIVOS POR VENDEDOR:');
      
      const productsBySeller = activeProducts.reduce((acc, product) => {
        const sellerId = product.seller_id;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(product);
        return acc;
      }, {});

      Object.entries(productsBySeller).forEach(([sellerId, products]) => {
        const seller = sellers?.find(s => s.id === sellerId);
        console.log(`\n🏪 ${seller?.name || 'Vendedor desconocido'} (${sellerId}):`);
        products.forEach(product => {
          console.log(`  - ${product.products.title} - Stock: ${product.stock} - $${Math.round(product.price_cents / 100)}`);
        });
      });
    }

    // 5. Verificar búsqueda específica de "aceite"
    console.log('\n🔍 Probando búsqueda de "aceite"...');
    const { data: aceiteProducts, error: aceiteError } = await supabase
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
          category
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .ilike('products.title', '%aceite%');

    if (aceiteError) {
      console.error('❌ Error en búsqueda de aceite:', aceiteError);
    } else {
      console.log(`🔍 Productos de "aceite" encontrados: ${aceiteProducts?.length || 0}`);
      if (aceiteProducts && aceiteProducts.length > 0) {
        aceiteProducts.forEach(product => {
          const seller = sellers?.find(s => s.id === product.seller_id);
          console.log(`  - ${product.products.title} (${seller?.name || 'Vendedor'}) - Stock: ${product.stock}`);
        });
      }
    }

    // 6. Limpiar productos inactivos o sin stock
    console.log('\n🧹 Limpiando productos inactivos o sin stock...');
    
    // Desactivar productos sin stock
    const { error: deactivateError } = await supabase
      .from('seller_products')
      .update({ active: false })
      .eq('stock', 0);

    if (deactivateError) {
      console.error('❌ Error desactivando productos sin stock:', deactivateError);
    } else {
      console.log('✅ Productos sin stock desactivados');
    }

    // 7. Verificar estado final
    console.log('\n📊 ESTADO FINAL:');
    const { data: finalActive, error: finalError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        stock,
        active,
        products!inner (title)
      `)
      .eq('active', true)
      .gt('stock', 0);

    if (finalError) {
      console.error('❌ Error verificando estado final:', finalError);
    } else {
      console.log(`🟢 Productos activos con stock: ${finalActive?.length || 0}`);
      
      if (finalActive && finalActive.length > 0) {
        console.log('\n📋 PRODUCTOS FINALES ACTIVOS:');
        finalActive.forEach(product => {
          const seller = sellers?.find(s => s.id === product.seller_id);
          console.log(`  - ${product.products.title} (${seller?.name || 'Vendedor'}) - Stock: ${product.stock}`);
        });
      }
    }

    // 8. Instrucciones para el usuario
    console.log('\n🚀 INSTRUCCIONES:');
    console.log('1. ✅ Verifica que solo Diego Ramírez tenga productos activos');
    console.log('2. 🔄 Si hay otros vendedores con stock, desactívalos manualmente');
    console.log('3. 🧪 Prueba la búsqueda de "aceite" en la aplicación');
    console.log('4. 📱 Verifica que solo aparezcan productos de Diego Ramírez');
    
    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - Solo Diego Ramírez debe tener productos activos');
    console.log('   - Búsqueda de "aceite" debe mostrar solo sus productos');
    console.log('   - Otros vendedores deben estar inactivos o sin stock');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyRealStock();






