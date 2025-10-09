#!/usr/bin/env node

/**
 * Script para limpiar productos de otros vendedores y dejar solo Diego Ramírez activo
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

async function cleanOtherSellers() {
  console.log('🧹 Limpiando productos de otros vendedores...\n');
  
  try {
    // 1. Obtener ID de Diego Ramírez
    console.log('👤 Buscando Diego Ramírez...');
    const { data: diego, error: diegoError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('name', 'Diego Ramírez')
      .single();

    if (diegoError || !diego) {
      console.error('❌ Diego Ramírez no encontrado:', diegoError);
      return;
    }

    console.log(`✅ Diego Ramírez encontrado: ${diego.name} (${diego.id})`);

    // 2. Obtener todos los vendedores
    console.log('\n👥 Obteniendo todos los vendedores...');
    const { data: allSellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);

    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }

    console.log(`📊 Total vendedores: ${allSellers?.length || 0}`);

    // 3. Identificar otros vendedores (no Diego Ramírez)
    const otherSellers = allSellers?.filter(seller => seller.id !== diego.id) || [];
    console.log(`🔄 Otros vendedores a desactivar: ${otherSellers.length}`);

    if (otherSellers.length > 0) {
      console.log('\n📋 Vendedores a desactivar:');
      otherSellers.forEach(seller => {
        console.log(`  - ${seller.name} (${seller.id})`);
      });
    }

    // 4. Desactivar productos de otros vendedores
    if (otherSellers.length > 0) {
      console.log('\n🚫 Desactivando productos de otros vendedores...');
      
      const otherSellerIds = otherSellers.map(seller => seller.id);
      
      const { error: deactivateError } = await supabase
        .from('seller_products')
        .update({ active: false })
        .in('seller_id', otherSellerIds);

      if (deactivateError) {
        console.error('❌ Error desactivando productos:', deactivateError);
        return;
      }

      console.log('✅ Productos de otros vendedores desactivados');
    }

    // 5. Verificar productos activos de Diego Ramírez
    console.log('\n✅ Verificando productos activos de Diego Ramírez...');
    const { data: diegoProducts, error: diegoProductsError } = await supabase
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
      .eq('seller_id', diego.id)
      .eq('active', true)
      .gt('stock', 0);

    if (diegoProductsError) {
      console.error('❌ Error obteniendo productos de Diego:', diegoProductsError);
      return;
    }

    console.log(`🟢 Productos activos de Diego Ramírez: ${diegoProducts?.length || 0}`);
    
    if (diegoProducts && diegoProducts.length > 0) {
      console.log('\n📋 PRODUCTOS ACTIVOS DE DIEGO RAMÍREZ:');
      diegoProducts.forEach(product => {
        console.log(`  - ${product.products.title} - Stock: ${product.stock} - $${Math.round(product.price_cents / 100)}`);
      });
    }

    // 6. Verificar productos activos de otros vendedores
    console.log('\n🔍 Verificando productos activos de otros vendedores...');
    const { data: otherProducts, error: otherProductsError } = await supabase
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
      .neq('seller_id', diego.id)
      .eq('active', true)
      .gt('stock', 0);

    if (otherProductsError) {
      console.error('❌ Error verificando otros productos:', otherProductsError);
      return;
    }

    console.log(`🔴 Productos activos de otros vendedores: ${otherProducts?.length || 0}`);

    if (otherProducts && otherProducts.length > 0) {
      console.log('\n⚠️  PRODUCTOS ACTIVOS DE OTROS VENDEDORES (deben estar desactivados):');
      otherProducts.forEach(product => {
        console.log(`  - ${product.products.title} - Stock: ${product.stock}`);
      });
    }

    // 7. Probar búsqueda de "aceite"
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
        console.log('\n📋 PRODUCTOS DE "ACEITE" ENCONTRADOS:');
        aceiteProducts.forEach(product => {
          const seller = allSellers?.find(s => s.id === product.seller_id);
          console.log(`  - ${product.products.title} (${seller?.name || 'Vendedor'}) - Stock: ${product.stock}`);
        });
      }
    }

    // 8. Resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Diego Ramírez: ${diegoProducts?.length || 0} productos activos`);
    console.log(`❌ Otros vendedores: ${otherProducts?.length || 0} productos activos`);
    console.log(`🔍 Búsqueda "aceite": ${aceiteProducts?.length || 0} productos encontrados`);

    if (otherProducts && otherProducts.length > 0) {
      console.log('\n⚠️  ADVERTENCIA: Aún hay productos activos de otros vendedores');
      console.log('🔄 Ejecuta el script nuevamente si es necesario');
    } else {
      console.log('\n🎉 ¡Limpieza completada exitosamente!');
      console.log('✅ Solo Diego Ramírez tiene productos activos');
    }

    console.log('\n🚀 INSTRUCCIONES PARA PROBAR:');
    console.log('1. ✅ Verifica que solo Diego Ramírez tenga productos activos');
    console.log('2. 🔍 Prueba la búsqueda de "aceite" en la aplicación');
    console.log('3. 📱 Verifica que solo aparezcan productos de Diego Ramírez');
    console.log('4. 🔄 Si hay otros productos activos, ejecuta el script nuevamente');

  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

cleanOtherSellers();






