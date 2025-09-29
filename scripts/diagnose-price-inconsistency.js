#!/usr/bin/env node

/**
 * Script para diagnosticar inconsistencias de precios
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

async function diagnosePriceInconsistency() {
  console.log('🔍 DIAGNÓSTICO DE INCONSISTENCIAS DE PRECIOS\n');
  
  try {
    // 1. Verificar productos en catálogo base
    console.log('📊 1. PRODUCTOS EN CATÁLOGO BASE:');
    const { data: baseProducts, error: baseError } = await supabase
      .from('products')
      .select('id, title, price_cents')
      .limit(5);
    
    if (baseError) {
      console.log('❌ Error obteniendo productos base:', baseError.message);
    } else {
      console.log(`✅ Productos base encontrados: ${baseProducts?.length || 0}`);
      baseProducts?.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title}: ${product.price_cents} centavos = $${product.price_cents / 100}`);
      });
    }
    
    // 2. Verificar productos de vendedores
    console.log('\n📊 2. PRODUCTOS DE VENDEDORES:');
    const { data: sellerProducts, error: sellerError } = await supabase
      .from('seller_products')
      .select('id, product_id, seller_id, price_cents, stock')
      .limit(10);
    
    if (sellerError) {
      console.log('❌ Error obteniendo productos de vendedores:', sellerError.message);
    } else {
      console.log(`✅ Productos de vendedores: ${sellerProducts?.length || 0}`);
      sellerProducts?.forEach((sp, index) => {
        console.log(`  ${index + 1}. Producto ID: ${sp.product_id} - Precio: ${sp.price_cents} centavos = $${sp.price_cents / 100} - Stock: ${sp.stock}`);
      });
    }
    
    // 3. Verificar items de carrito
    console.log('\n📊 3. ITEMS DE CARRITO:');
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id, product_id, title, price_cents, qty')
      .limit(10);
    
    if (cartError) {
      console.log('❌ Error obteniendo items de carrito:', cartError.message);
    } else {
      console.log(`✅ Items de carrito: ${cartItems?.length || 0}`);
      cartItems?.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}: ${item.price_cents} centavos = $${item.price_cents / 100} x ${item.qty}`);
      });
    }
    
    // 4. Verificar items de órdenes
    console.log('\n📊 4. ITEMS DE ÓRDENES:');
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, title, price_cents, qty')
      .limit(10);
    
    if (orderError) {
      console.log('❌ Error obteniendo items de órdenes:', orderError.message);
    } else {
      console.log(`✅ Items de órdenes: ${orderItems?.length || 0}`);
      orderItems?.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}: ${item.price_cents} centavos = $${item.price_cents / 100} x ${item.qty}`);
      });
    }
    
    // 5. Verificar órdenes completas
    console.log('\n📊 5. ÓRDENES COMPLETAS:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, total_cents, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.log('❌ Error obteniendo órdenes:', ordersError.message);
    } else {
      console.log(`✅ Órdenes encontradas: ${orders?.length || 0}`);
      orders?.forEach((order, index) => {
        console.log(`  ${index + 1}. Orden ID: ${order.id.substring(0, 8)}... - Total: ${order.total_cents} centavos = $${order.total_cents / 100} - Estado: ${order.status}`);
      });
    }
    
    // 6. ANÁLISIS DE INCONSISTENCIAS
    console.log('\n🔍 ANÁLISIS DE INCONSISTENCIAS:');
    
    // Verificar si hay precios muy grandes (posiblemente en pesos en lugar de centavos)
    const allPrices = [
      ...(baseProducts?.map(p => ({ source: 'base', price: p.price_cents, title: p.title })) || []),
      ...(sellerProducts?.map(sp => ({ source: 'seller', price: sp.price_cents, title: `Seller Product ${sp.id}` })) || []),
      ...(cartItems?.map(ci => ({ source: 'cart', price: ci.price_cents, title: ci.title })) || []),
      ...(orderItems?.map(oi => ({ source: 'order', price: oi.price_cents, title: oi.title })) || [])
    ];
    
    const suspiciousPrices = allPrices.filter(p => p.price > 10000); // Más de $100
    const normalPrices = allPrices.filter(p => p.price <= 10000);
    
    console.log(`✅ Precios normales (≤$100): ${normalPrices.length}`);
    console.log(`⚠️  Precios sospechosos (>$100): ${suspiciousPrices.length}`);
    
    if (suspiciousPrices.length > 0) {
      console.log('\n🚨 PRECIOS SOSPECHOSOS DETECTADOS:');
      suspiciousPrices.forEach((price, index) => {
        console.log(`  ${index + 1}. ${price.title} (${price.source}): ${price.price} centavos = $${price.price / 100}`);
      });
    }
    
    // 7. RECOMENDACIONES
    console.log('\n💡 RECOMENDACIONES:');
    
    if (suspiciousPrices.length > 0) {
      console.log('❌ PROBLEMA DETECTADO: Hay precios que parecen estar en pesos en lugar de centavos');
      console.log('🔧 SOLUCIÓN: Estandarizar todos los precios a centavos');
      console.log('📝 ACCIÓN: Revisar y corregir la función formatPrice en money.ts');
    } else {
      console.log('✅ Los precios parecen estar correctamente en centavos');
    }
    
    // 8. VERIFICAR FUNCIÓN FORMATPRICE
    console.log('\n🔍 VERIFICANDO FUNCIÓN FORMATPRICE:');
    
    const testPrices = [100, 1000, 5000, 10000, 50000, 100000];
    console.log('Precios de prueba:');
    testPrices.forEach(price => {
      const isLarge = price > 1000;
      const formatted = isLarge ? 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price) :
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price / 100);
      console.log(`  ${price} centavos → ${formatted} (${isLarge ? 'tratado como pesos' : 'dividido por 100'})`);
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

diagnosePriceInconsistency();
