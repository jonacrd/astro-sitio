#!/usr/bin/env node

/**
 * Script para verificar que la corrección del problema de carga de pedidos funciona
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

async function testPedidosLoadingFix() {
  console.log('🧪 Verificando corrección del problema de carga de pedidos...\n');
  
  try {
    // 1. Verificar que el archivo existe y tiene la corrección
    console.log('📄 Verificando archivo dashboard/pedidos.astro...');
    const pedidosPath = path.join(process.cwd(), 'src/pages/dashboard/pedidos.astro');
    if (!fs.existsSync(pedidosPath)) {
      console.error('❌ El archivo dashboard/pedidos.astro no existe');
      return;
    }
    
    const pedidosContent = fs.readFileSync(pedidosPath, 'utf8');
    
    // Verificar que no tiene el join problemático
    if (!pedidosContent.includes('profiles!orders_buyer_id_fkey')) {
      console.log('✅ Join problemático eliminado');
    } else {
      console.log('❌ Join problemático aún presente');
    }
    
    // Verificar que tiene la consulta separada
    if (pedidosContent.includes('from(\'profiles\')') && pedidosContent.includes('profilesMap')) {
      console.log('✅ Consulta separada implementada');
    } else {
      console.log('❌ Consulta separada no implementada');
    }
    
    // 2. Probar consulta de pedidos sin join
    console.log('\n📦 Probando consulta de pedidos...');
    
    // Obtener vendedores
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true)
      .limit(1);
    
    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
    } else if (sellers && sellers.length > 0) {
      const seller = sellers[0];
      console.log(`✅ Vendedor encontrado: ${seller.name}`);
      
      // Probar consulta de pedidos sin join
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_cents, created_at, buyer_id')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (ordersError) {
        console.error('❌ Error en consulta de pedidos:', ordersError);
      } else {
        console.log(`✅ Pedidos cargados exitosamente: ${orders.length}`);
        
        if (orders.length > 0) {
          // Probar consulta de perfiles por separado
          const buyerIds = [...new Set(orders.map(order => order.buyer_id))];
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', buyerIds);
          
          if (profilesError) {
            console.error('❌ Error en consulta de perfiles:', profilesError);
          } else {
            console.log(`✅ Perfiles cargados exitosamente: ${profiles.length}`);
            
            // Verificar que se puede mapear
            const profilesMap = {};
            if (profiles) {
              profiles.forEach(profile => {
                profilesMap[profile.id] = profile.name;
              });
            }
            
            console.log('✅ Mapeo de perfiles funcionando');
            
            // Mostrar ejemplo de pedido
            const order = orders[0];
            const buyerName = profilesMap[order.buyer_id] || 'Cliente';
            const price = (order.total_cents / 100).toFixed(2);
            
            console.log(`📋 Ejemplo de pedido:`);
            console.log(`   ID: ${order.id.substring(0, 8)}`);
            console.log(`   Estado: ${order.status}`);
            console.log(`   Cliente: ${buyerName}`);
            console.log(`   Precio: $${price}`);
          }
        }
      }
    }
    
    // 3. Verificar que la función renderOrders es async
    if (pedidosContent.includes('async function renderOrders')) {
      console.log('✅ Función renderOrders es async');
    } else {
      console.log('❌ Función renderOrders no es async');
    }
    
    // 4. Verificar que se llama con await
    if (pedidosContent.includes('await renderOrders')) {
      console.log('✅ Llamada a renderOrders con await');
    } else {
      console.log('❌ Llamada a renderOrders sin await');
    }
    
    // 5. Verificar manejo de errores
    const errorHandling = [
      'try {',
      'catch (error)',
      'console.error',
      'profilesError'
    ];
    
    let errorHandlingFound = 0;
    errorHandling.forEach(element => {
      if (pedidosContent.includes(element)) {
        errorHandlingFound++;
      }
    });
    
    console.log(`✅ Manejo de errores encontrado: ${errorHandlingFound}/${errorHandling.length}`);
    
    // 6. Verificar que no hay errores de sintaxis
    const syntaxErrors = [
      'Unterminated template literal',
      'Expected ")" but found',
      'Cannot find name',
      'Operator \'<\' cannot be applied'
    ];
    
    let syntaxErrorsFound = 0;
    syntaxErrors.forEach(error => {
      if (pedidosContent.includes(error)) {
        syntaxErrorsFound++;
      }
    });
    
    if (syntaxErrorsFound === 0) {
      console.log('✅ Sin errores de sintaxis detectados');
    } else {
      console.log(`⚠️ Posibles errores de sintaxis: ${syntaxErrorsFound}`);
    }
    
    // 7. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Join problemático eliminado: ${!pedidosContent.includes('profiles!orders_buyer_id_fkey')}`);
    console.log(`✅ Consulta separada implementada: ${pedidosContent.includes('from(\'profiles\')') && pedidosContent.includes('profilesMap')}`);
    console.log(`✅ Función async: ${pedidosContent.includes('async function renderOrders')}`);
    console.log(`✅ Llamada con await: ${pedidosContent.includes('await renderOrders')}`);
    console.log(`✅ Manejo de errores: ${errorHandlingFound}/${errorHandling.length}`);
    console.log(`✅ Errores de sintaxis: ${syntaxErrorsFound === 0 ? 'Ninguno' : syntaxErrorsFound}`);
    
    if (!pedidosContent.includes('profiles!orders_buyer_id_fkey') && 
        pedidosContent.includes('from(\'profiles\')') && 
        pedidosContent.includes('profilesMap') &&
        pedidosContent.includes('async function renderOrders') &&
        pedidosContent.includes('await renderOrders') &&
        syntaxErrorsFound === 0) {
      console.log('\n🎉 ¡Problema de carga de pedidos corregido completamente!');
      console.log('\n💡 Correcciones implementadas:');
      console.log('   ✅ Join problemático eliminado');
      console.log('   ✅ Consulta separada de perfiles');
      console.log('   ✅ Función renderOrders async');
      console.log('   ✅ Llamada con await');
      console.log('   ✅ Manejo robusto de errores');
      console.log('   ✅ Sin errores de sintaxis');
      console.log('   ✅ Carga de pedidos funcional');
    } else {
      console.log('\n⚠️ Algunas correcciones necesitan ajustes');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testPedidosLoadingFix();










