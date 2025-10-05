#!/usr/bin/env node

/**
 * Script para verificar el estado actual de los precios
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentPrices() {
  console.log('🔍 VERIFICANDO ESTADO ACTUAL DE PRECIOS\n');
  
  try {
    // 1. Verificar productos de vendedores
    console.log('📊 1. PRODUCTOS DE VENDEDORES:');
    const { data: sellerProducts, error: sellerError } = await supabase
      .from('seller_products')
      .select('id, product_id, price_cents, stock, active, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (sellerError) {
      console.log('❌ Error obteniendo productos de vendedores:', sellerError.message);
      return;
    }
    
    console.log(`✅ Productos de vendedores: ${sellerProducts?.length || 0}`);
    sellerProducts?.forEach((sp, index) => {
      const pesos = sp.price_cents / 100;
      const isSuspicious = sp.price_cents > 10000; // Más de $100
      console.log(`  ${index + 1}. Producto ID: ${sp.product_id} - ${sp.price_cents} centavos = $${pesos} - Stock: ${sp.stock} - Activo: ${sp.active} ${isSuspicious ? '(SOSPECHOSO)' : ''}`);
    });
    
    // 2. Verificar si hay productos con precios sospechosos
    console.log('\n📊 2. ANÁLISIS DE PRECIOS:');
    const suspiciousProducts = sellerProducts?.filter(sp => sp.price_cents > 10000) || [];
    const normalProducts = sellerProducts?.filter(sp => sp.price_cents <= 10000) || [];
    
    console.log(`✅ Productos con precios normales (≤$100): ${normalProducts.length}`);
    console.log(`⚠️  Productos con precios sospechosos (>$100): ${suspiciousProducts.length}`);
    
    if (suspiciousProducts.length > 0) {
      console.log('\n🚨 PRODUCTOS CON PRECIOS SOSPECHOSOS:');
      suspiciousProducts.forEach((sp, index) => {
        const pesos = sp.price_cents / 100;
        console.log(`  ${index + 1}. Producto ID: ${sp.product_id} - ${sp.price_cents} centavos = $${pesos} (Última actualización: ${sp.updated_at})`);
      });
    }
    
    // 3. Verificar órdenes recientes
    console.log('\n📊 3. ÓRDENES RECIENTES:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_cents, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.log('❌ Error obteniendo órdenes:', ordersError.message);
    } else {
      console.log(`✅ Órdenes: ${orders?.length || 0}`);
      orders?.forEach((order, index) => {
        const pesos = order.total_cents / 100;
        console.log(`  ${index + 1}. Orden ID: ${order.id.substring(0, 8)}... - ${order.total_cents} centavos = $${pesos} - Estado: ${order.status}`);
      });
    }
    
    // 4. Verificar items de carrito
    console.log('\n📊 4. ITEMS DE CARRITO:');
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id, product_id, title, price_cents, qty')
      .limit(5);
    
    if (cartError) {
      console.log('❌ Error obteniendo items de carrito:', cartError.message);
    } else {
      console.log(`✅ Items de carrito: ${cartItems?.length || 0}`);
      cartItems?.forEach((item, index) => {
        const pesos = item.price_cents / 100;
        console.log(`  ${index + 1}. ${item.title}: ${item.price_cents} centavos = $${pesos} x ${item.qty}`);
      });
    }
    
    console.log('\n🎯 DIAGNÓSTICO:');
    
    if (suspiciousProducts.length > 0) {
      console.log('❌ PROBLEMA: Hay productos con precios incorrectos en la base de datos');
      console.log('💡 SOLUCIÓN: Ejecutar script de limpieza de precios');
      console.log('🔧 COMANDO: node astro-sitio/scripts/fix-incorrect-prices.js');
    } else {
      console.log('✅ Los precios en la base de datos parecen correctos');
    }
    
    console.log('\n💡 POSIBLES CAUSAS DE QUE NO SE APLIQUEN LOS CAMBIOS:');
    console.log('1. 🔄 Cache del navegador - Limpiar cache y recargar');
    console.log('2. 🚀 Servidor de desarrollo - Reiniciar servidor');
    console.log('3. 📦 Build del proyecto - Recompilar');
    console.log('4. 🗄️ Base de datos - Verificar que los datos estén correctos');
    console.log('5. 🔧 Componente - Verificar que se esté usando el componente correcto');
    
    console.log('\n🎯 PASOS PARA SOLUCIONAR:');
    console.log('1. ✅ Verificar estado de la base de datos (este script)');
    console.log('2. ✅ Limpiar cache del navegador (Ctrl+F5)');
    console.log('3. ✅ Reiniciar servidor de desarrollo');
    console.log('4. ✅ Probar configurar un producto');
    console.log('5. ✅ Verificar que se guarde correctamente');

  } catch (error) {
    console.error('❌ Error verificando precios:', error);
  }
}

checkCurrentPrices();





