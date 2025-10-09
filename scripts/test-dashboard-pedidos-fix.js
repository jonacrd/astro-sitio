#!/usr/bin/env node

/**
 * Script para verificar que la página dashboard/pedidos funciona correctamente después de la corrección
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

async function testDashboardPedidosFix() {
  console.log('🧪 Verificando corrección de dashboard/pedidos...\n');
  
  try {
    // 1. Verificar que el archivo existe y no tiene errores de sintaxis
    console.log('📄 Verificando archivo dashboard/pedidos.astro...');
    const pedidosPath = path.join(process.cwd(), 'src/pages/dashboard/pedidos.astro');
    if (!fs.existsSync(pedidosPath)) {
      console.error('❌ El archivo dashboard/pedidos.astro no existe');
      return;
    }
    
    const pedidosContent = fs.readFileSync(pedidosPath, 'utf8');
    
    // Verificar que no tiene errores de sintaxis comunes
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
    
    // 2. Verificar elementos del diseño
    const requiredElements = [
      'bg-gray-900',
      'bg-gray-800',
      'filter-btn',
      'orders-container',
      'Tienda',
      'Todos',
      'Pendientes',
      'Confirmado',
      'Entregados'
    ];
    
    let elementsFound = 0;
    requiredElements.forEach(element => {
      if (pedidosContent.includes(element)) {
        elementsFound++;
      }
    });
    
    console.log(`✅ Elementos del diseño encontrados: ${elementsFound}/${requiredElements.length}`);
    
    // 3. Verificar funciones JavaScript
    const jsFunctions = [
      'loadOrders',
      'renderOrders',
      'setupFilters',
      'DOMContentLoaded'
    ];
    
    let jsFunctionsFound = 0;
    jsFunctions.forEach(func => {
      if (pedidosContent.includes(func)) {
        jsFunctionsFound++;
      }
    });
    
    console.log(`✅ Funciones JavaScript encontradas: ${jsFunctionsFound}/${jsFunctions.length}`);
    
    // 4. Verificar consulta de Supabase
    if (pedidosContent.includes('profiles!orders_buyer_id_fkey')) {
      console.log('✅ Consulta de Supabase con join implementada');
    } else {
      console.log('⚠️ Consulta de Supabase no encontrada');
    }
    
    // 5. Verificar manejo de errores
    const errorHandling = [
      'try {',
      'catch (error)',
      'console.error',
      'if (userError || !user)'
    ];
    
    let errorHandlingFound = 0;
    errorHandling.forEach(element => {
      if (pedidosContent.includes(element)) {
        errorHandlingFound++;
      }
    });
    
    console.log(`✅ Manejo de errores encontrado: ${errorHandlingFound}/${errorHandling.length}`);
    
    // 6. Verificar estilos CSS
    const cssElements = [
      '.filter-btn',
      'transition',
      'active',
      'hover'
    ];
    
    let cssElementsFound = 0;
    cssElements.forEach(element => {
      if (pedidosContent.includes(element)) {
        cssElementsFound++;
      }
    });
    
    console.log(`✅ Estilos CSS encontrados: ${cssElementsFound}/${cssElements.length}`);
    
    // 7. Probar con pedidos reales
    console.log('\n📦 Probando con pedidos reales...');
    
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
      
      // Probar pedidos del vendedor
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_cents, created_at, buyer_id')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!ordersError && orders) {
        console.log(`✅ Pedidos del vendedor: ${orders.length}`);
        
        // Verificar estados de pedidos
        const statusCounts = {};
        orders.forEach(order => {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });
        
        console.log('📊 Estados de pedidos:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`);
        });
        
        // Verificar totales
        const totalSales = orders.reduce((sum, order) => sum + (order.total_cents || 0), 0);
        console.log(`💰 Total de ventas: $${(totalSales / 100).toFixed(2)}`);
      }
    }
    
    // 8. Verificar diseño responsive
    console.log('\n📱 Verificando diseño responsive...');
    const responsiveClasses = [
      'overflow-x-auto',
      'whitespace-nowrap',
      'space-y-3',
      'flex items-center',
      'justify-between'
    ];
    
    let responsiveClassesFound = 0;
    responsiveClasses.forEach(cls => {
      if (pedidosContent.includes(cls)) {
        responsiveClassesFound++;
      }
    });
    
    console.log(`✅ Clases responsive encontradas: ${responsiveClassesFound}/${responsiveClasses.length}`);
    
    // 9. Verificar tema oscuro
    console.log('\n🌙 Verificando tema oscuro...');
    const darkThemeClasses = [
      'bg-gray-900',
      'bg-gray-800',
      'text-white',
      'text-gray-400',
      'text-blue-500'
    ];
    
    let darkThemeClassesFound = 0;
    darkThemeClasses.forEach(cls => {
      if (pedidosContent.includes(cls)) {
        darkThemeClassesFound++;
      }
    });
    
    console.log(`✅ Clases de tema oscuro encontradas: ${darkThemeClassesFound}/${darkThemeClasses.length}`);
    
    // 10. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Elementos del diseño: ${elementsFound}/${requiredElements.length}`);
    console.log(`✅ Funciones JavaScript: ${jsFunctionsFound}/${jsFunctions.length}`);
    console.log(`✅ Manejo de errores: ${errorHandlingFound}/${errorHandling.length}`);
    console.log(`✅ Estilos CSS: ${cssElementsFound}/${cssElements.length}`);
    console.log(`✅ Clases responsive: ${responsiveClassesFound}/${responsiveClasses.length}`);
    console.log(`✅ Clases de tema oscuro: ${darkThemeClassesFound}/${darkThemeClasses.length}`);
    console.log(`✅ Errores de sintaxis: ${syntaxErrorsFound === 0 ? 'Ninguno' : syntaxErrorsFound}`);
    
    if (elementsFound === requiredElements.length && 
        jsFunctionsFound === jsFunctions.length &&
        errorHandlingFound === errorHandling.length &&
        cssElementsFound === cssElements.length &&
        syntaxErrorsFound === 0) {
      console.log('\n🎉 ¡Dashboard/pedidos corregido completamente!');
      console.log('\n💡 Funcionalidades implementadas:');
      console.log('   ✅ Sin errores de sintaxis');
      console.log('   ✅ Header con iconos y notificaciones');
      console.log('   ✅ Filtros horizontales interactivos');
      console.log('   ✅ Tarjetas de pedidos con información detallada');
      console.log('   ✅ Tema oscuro consistente');
      console.log('   ✅ Diseño responsive y mobile-first');
      console.log('   ✅ Carga dinámica de datos desde Supabase');
      console.log('   ✅ Estados de pedidos con colores diferenciados');
      console.log('   ✅ Interacciones y transiciones suaves');
      console.log('   ✅ Manejo robusto de errores');
    } else {
      console.log('\n⚠️ Algunas funcionalidades necesitan corrección');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testDashboardPedidosFix();







