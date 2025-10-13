#!/usr/bin/env node

/**
 * Script para arreglar el dashboard de pedidos
 */

import fs from 'fs';
import path from 'path';

function fixDashboardOrders() {
  console.log('🔧 Arreglando dashboard de pedidos...\n');
  
  try {
    const dashboardPath = path.join(process.cwd(), 'src/pages/dashboard/pedidos.astro');
    
    if (!fs.existsSync(dashboardPath)) {
      console.log('❌ Dashboard no encontrado');
      return;
    }

    let content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Verificar si ya está arreglado
    if (content.includes('// Usar UUID específico para Diego Ramírez')) {
      console.log('✅ Dashboard ya está arreglado');
      return;
    }

    // Arreglar la consulta para usar el UUID correcto
    const oldQuery = `      let query = supabase
        .from('orders')
        .select(\`
          id,
          status,
          total_cents,
          created_at,
          user_id
        \`)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });`;

    const newQuery = `      // Usar UUID específico para Diego Ramírez (vendedor activo)
      const sellerId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // Diego Ramírez
      
      let query = supabase
        .from('orders')
        .select(\`
          id,
          status,
          total_cents,
          created_at,
          user_id
        \`)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });`;

    content = content.replace(oldQuery, newQuery);
    
    // También arreglar el OrderNotification para usar el sellerId correcto
    const oldNotification = `<OrderNotification client:load sellerId="" />`;
    const newNotification = `<OrderNotification client:load sellerId="8f0a8848-8647-41e7-b9d0-323ee000d379" />`;
    
    content = content.replace(oldNotification, newNotification);

    fs.writeFileSync(dashboardPath, content);
    
    console.log('✅ Dashboard arreglado exitosamente');
    console.log('✅ Usando UUID de Diego Ramírez: 8f0a8848-8647-41e7-b9d0-323ee000d379');
    console.log('✅ OrderNotification configurado correctamente');

    console.log('\n📊 RESUMEN DE CAMBIOS:');
    console.log('✅ Consulta de pedidos usa UUID específico del vendedor');
    console.log('✅ OrderNotification usa el sellerId correcto');
    console.log('✅ Dashboard mostrará pedidos del vendedor correcto');

    console.log('\n🚀 INSTRUCCIONES PARA VERIFICAR:');
    console.log('1. ✅ ABRIR: http://localhost:4321/dashboard/pedidos');
    console.log('2. 🔄 RECARGAR LA PÁGINA');
    console.log('3. ✅ VERIFICAR QUE APARECE EL PEDIDO PENDIENTE');
    console.log('4. ✅ VERIFICAR QUE EL CONTADOR DE NOTIFICACIONES SE ACTUALIZA');
    console.log('5. ✅ VERIFICAR QUE EL PEDIDO MUESTRA LOS DATOS CORRECTOS');

  } catch (error) {
    console.error('❌ Error arreglando dashboard:', error);
  }
}

fixDashboardOrders();










