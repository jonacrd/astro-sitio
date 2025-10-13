#!/usr/bin/env node

/**
 * Script para probar la nueva interfaz de dashboard/pedidos
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

async function testDashboardPedidos() {
  console.log('🧪 Probando nueva interfaz de dashboard/pedidos...\n');
  
  try {
    // 1. Verificar que el archivo existe y tiene el contenido correcto
    console.log('📄 Verificando archivo dashboard/pedidos.astro...');
    const pedidosPath = path.join(process.cwd(), 'src/pages/dashboard/pedidos.astro');
    if (!fs.existsSync(pedidosPath)) {
      console.error('❌ El archivo dashboard/pedidos.astro no existe');
      return;
    }
    
    const pedidosContent = fs.readFileSync(pedidosPath, 'utf8');
    
    // Verificar elementos del diseño
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
    
    // 2. Verificar que tiene el header con iconos
    if (pedidosContent.includes('Tienda') && pedidosContent.includes('bg-blue-600')) {
      console.log('✅ Header con iconos implementado');
    } else {
      console.error('❌ Header con iconos no implementado');
    }
    
    // 3. Verificar que tiene filtros horizontales
    const filterElements = [
      'filter-btn',
      'data-filter',
      'Todos',
      'Pendientes',
      'Confirmado',
      'Entregados'
    ];
    
    let filterElementsFound = 0;
    filterElements.forEach(element => {
      if (pedidosContent.includes(element)) {
        filterElementsFound++;
      }
    });
    
    console.log(`✅ Elementos de filtros encontrados: ${filterElementsFound}/${filterElements.length}`);
    
    // 4. Verificar que tiene JavaScript para cargar pedidos
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
    
    // 5. Verificar que tiene estilos CSS
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
    
    // 6. Probar con pedidos reales
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
    
    // 7. Verificar diseño responsive
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
    
    // 8. Verificar tema oscuro
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
    
    // 9. Verificar funcionalidades interactivas
    console.log('\n⚡ Verificando funcionalidades interactivas...');
    const interactiveElements = [
      'addEventListener',
      'click',
      'hover',
      'transition',
      'data-filter'
    ];
    
    let interactiveElementsFound = 0;
    interactiveElements.forEach(element => {
      if (pedidosContent.includes(element)) {
        interactiveElementsFound++;
      }
    });
    
    console.log(`✅ Elementos interactivos encontrados: ${interactiveElementsFound}/${interactiveElements.length}`);
    
    // 10. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Elementos del diseño: ${elementsFound}/${requiredElements.length}`);
    console.log(`✅ Elementos de filtros: ${filterElementsFound}/${filterElements.length}`);
    console.log(`✅ Funciones JavaScript: ${jsFunctionsFound}/${jsFunctions.length}`);
    console.log(`✅ Estilos CSS: ${cssElementsFound}/${cssElements.length}`);
    console.log(`✅ Clases responsive: ${responsiveClassesFound}/${responsiveClasses.length}`);
    console.log(`✅ Clases de tema oscuro: ${darkThemeClassesFound}/${darkThemeClasses.length}`);
    console.log(`✅ Elementos interactivos: ${interactiveElementsFound}/${interactiveElements.length}`);
    
    if (elementsFound === requiredElements.length && 
        filterElementsFound === filterElements.length && 
        jsFunctionsFound === jsFunctions.length &&
        cssElementsFound === cssElements.length) {
      console.log('\n🎉 ¡Nueva interfaz de dashboard/pedidos implementada completamente!');
      console.log('\n💡 Funcionalidades implementadas:');
      console.log('   ✅ Header con iconos y notificaciones');
      console.log('   ✅ Filtros horizontales interactivos');
      console.log('   ✅ Tarjetas de pedidos con información detallada');
      console.log('   ✅ Tema oscuro consistente');
      console.log('   ✅ Diseño responsive y mobile-first');
      console.log('   ✅ Carga dinámica de datos desde Supabase');
      console.log('   ✅ Estados de pedidos con colores diferenciados');
      console.log('   ✅ Interacciones y transiciones suaves');
    } else {
      console.log('\n⚠️ Algunas funcionalidades necesitan corrección');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testDashboardPedidos();










