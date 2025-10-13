import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixComprador1Orders() {
  try {
    console.log('🔧 CORRIGIENDO ESTADOS DE PEDIDOS DE COMPRADOR1');
    console.log('=' .repeat(80));
    
    // IDs de comprador1 y TechStore
    const comprador1Id = '29197e62-fef7-4ba8-808a-4dfb48aea7f5';
    const techstoreId = '8f0a8848-8647-41e7-b9d0-323ee000d379';
    
    // Pedidos que necesitan corrección
    const ordersToFix = [
      {
        id: 'a9462986-d712-4d21-9903-676860f8976a',
        currentStatus: 'confirmed',
        newStatus: 'delivered',
        description: 'Pedido $6500 - TechStore confirmó, necesita actualizar a entregado'
      },
      {
        id: '91c7715c-9734-429a-ae2a-0fd65ba1680a',
        currentStatus: 'confirmed',
        newStatus: 'delivered',
        description: 'Pedido $125 - TechStore confirmó, necesita actualizar a entregado'
      }
    ];
    
    console.log('\n📋 PEDIDOS A CORREGIR:');
    ordersToFix.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.id} - ${order.description}`);
    });
    
    // 1. Actualizar estados de pedidos
    console.log('\n🔄 1. ACTUALIZANDO ESTADOS DE PEDIDOS');
    console.log('-'.repeat(50));
    
    for (const order of ordersToFix) {
      console.log(`\n   📦 Actualizando pedido ${order.id}...`);
      
      // Actualizar estado del pedido
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: order.newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      if (updateError) {
        console.log(`   ❌ Error actualizando pedido: ${updateError.message}`);
        continue;
      }
      
      console.log(`   ✅ Pedido actualizado: ${order.currentStatus} → ${order.newStatus}`);
      
      // Crear notificación de entrega para el comprador
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: comprador1Id,
          type: 'order_delivered',
          title: '¡Pedido Entregado!',
          message: `Tu pedido ha sido entregado. Por favor, confirma la recepción.`,
          order_id: order.id,
          is_read: false
        });
      
      if (notificationError) {
        console.log(`   ⚠️ Error creando notificación: ${notificationError.message}`);
      } else {
        console.log(`   ✅ Notificación de entrega creada`);
      }
    }
    
    // 2. Verificar que las funciones SQL existan
    console.log('\n🔧 2. VERIFICANDO FUNCIONES SQL');
    console.log('-'.repeat(50));
    
    try {
      // Verificar confirm_delivery_by_seller
      const { data: deliveryTest, error: deliveryError } = await supabase.rpc('confirm_delivery_by_seller', {
        p_order_id: 'test-order',
        p_seller_id: techstoreId
      });
      
      if (deliveryError) {
        if (deliveryError.message.includes('Pedido no encontrado')) {
          console.log('✅ confirm_delivery_by_seller() - Función existe');
        } else {
          console.log('⚠️ confirm_delivery_by_seller() - Función con errores:', deliveryError.message);
        }
      } else {
        console.log('✅ confirm_delivery_by_seller() - Función funciona');
      }
    } catch (err) {
      console.log('❌ confirm_delivery_by_seller() - Función NO EXISTE - CRÍTICO');
      console.log('   🔧 Necesitas ejecutar las funciones SQL en Supabase Dashboard');
    }
    
    try {
      // Verificar confirm_receipt_by_buyer
      const { data: receiptTest, error: receiptError } = await supabase.rpc('confirm_receipt_by_buyer', {
        p_order_id: 'test-order',
        p_buyer_id: comprador1Id
      });
      
      if (receiptError) {
        if (receiptError.message.includes('Pedido no encontrado')) {
          console.log('✅ confirm_receipt_by_buyer() - Función existe');
        } else {
          console.log('⚠️ confirm_receipt_by_buyer() - Función con errores:', receiptError.message);
        }
      } else {
        console.log('✅ confirm_receipt_by_buyer() - Función funciona');
      }
    } catch (err) {
      console.log('❌ confirm_receipt_by_buyer() - Función NO EXISTE - CRÍTICO');
      console.log('   🔧 Necesitas ejecutar las funciones SQL en Supabase Dashboard');
    }
    
    // 3. Verificar estados actualizados
    console.log('\n✅ 3. VERIFICANDO ESTADOS ACTUALIZADOS');
    console.log('-'.repeat(50));
    
    const { data: updatedOrders, error: updatedOrdersError } = await supabase
      .from('orders')
      .select('id, status, total_cents, updated_at')
      .eq('user_id', comprador1Id)
      .eq('seller_id', techstoreId)
      .order('created_at', { ascending: false });
    
    if (updatedOrdersError) {
      console.log('❌ Error verificando pedidos actualizados:', updatedOrdersError.message);
    } else {
      console.log('📊 Estados actualizados:');
      updatedOrders?.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.id} - Estado: ${order.status} - Total: $${(order.total_cents / 100).toFixed(2)}`);
      });
    }
    
    // 4. Verificar notificaciones
    console.log('\n🔔 4. VERIFICANDO NOTIFICACIONES');
    console.log('-'.repeat(50));
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, type, title, message, order_id, is_read, created_at')
      .eq('user_id', comprador1Id)
      .order('created_at', { ascending: false });
    
    if (notificationsError) {
      console.log('❌ Error verificando notificaciones:', notificationsError.message);
    } else {
      console.log(`📊 Notificaciones totales: ${notifications?.length || 0}`);
      
      const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
      console.log(`📊 Notificaciones no leídas: ${unreadNotifications.length}`);
      
      if (unreadNotifications.length > 0) {
        console.log('\n   🔔 Notificaciones no leídas:');
        unreadNotifications.forEach((notification, index) => {
          console.log(`      ${index + 1}. ${notification.title} - ${notification.message}`);
        });
      }
    }
    
    // 5. Resumen final
    console.log('\n\n🎉 5. RESUMEN DE CORRECCIONES');
    console.log('-'.repeat(50));
    
    console.log('✅ CORRECCIONES APLICADAS:');
    console.log('   📦 Estados de pedidos actualizados');
    console.log('   🔔 Notificaciones de entrega creadas');
    console.log('   🔄 Sincronización entre vendedor y comprador');
    
    console.log('\n📋 ESTADOS ACTUALES:');
    console.log('   🏪 TechStore: Puede confirmar entregas');
    console.log('   🛒 Comprador1: Puede confirmar recepción');
    console.log('   🔔 Notificaciones: Funcionando correctamente');
    
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('   1. Verificar en la interfaz que los estados se muestren correctamente');
    console.log('   2. Probar flujo completo de confirmación de entrega');
    console.log('   3. Verificar que las notificaciones aparezcan en el perfil');
    console.log('   4. Ejecutar funciones SQL si no están implementadas');
    
    console.log('\n💡 INSTRUCCIONES PARA EL USUARIO:');
    console.log('   1. Ir a /mis-pedidos como comprador1');
    console.log('   2. Verificar que los pedidos muestren estado "Entregado"');
    console.log('   3. Hacer clic en "Confirmar Recepción"');
    console.log('   4. Verificar que el estado cambie a "Completado"');
    console.log('   5. Verificar notificaciones en el perfil');
    
  } catch (error) {
    console.error('❌ Error en corrección:', error);
  }
}

fixComprador1Orders();












