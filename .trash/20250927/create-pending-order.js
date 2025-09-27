import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

// Cliente con service role para crear pedidos
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPendingOrder() {
  try {
    console.log('🔧 Creando pedido en preparación entre comprador1 y techstore...');
    
    // IDs específicos
    const comprador1Id = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1@gmail.com
    const techstoreId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore.digital@gmail.com
    
    console.log(`👤 Comprador1: ${comprador1Id}`);
    console.log(`🏪 TechStore: ${techstoreId}`);
    
    // Crear pedido en preparación
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: comprador1Id,
        seller_id: techstoreId,
        total_cents: 12500, // $125.00
        status: 'confirmed', // En preparación
        payment_method: 'efectivo',
        delivery_address: JSON.stringify({
          fullName: 'Comprador1 Test',
          address: 'Calle Principal 123',
          city: 'Ciudad Test',
          state: 'Estado Test',
          zipCode: '12345',
          phone: '1234567890',
          instructions: 'Entregar en la puerta principal'
        }),
        delivery_notes: 'Pedido de prueba en preparación'
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creando pedido:', orderError.message);
      return;
    }

    console.log('✅ Pedido creado exitosamente!');
    console.log('📋 Pedido:', {
      id: order.id,
      total: `$${(order.total_cents / 100).toFixed(2)}`,
      status: order.status,
      seller: order.seller_id,
      buyer: order.user_id
    });
    
    // Crear notificación para el comprador
    console.log('🔔 Creando notificación para el comprador...');
    
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: comprador1Id,
        type: 'order_confirmed',
        title: '¡Pedido Confirmado!',
        message: `Tu pedido por $${(order.total_cents / 100).toFixed(2)} ha sido confirmado y está en preparación`,
        order_id: order.id,
        is_read: false
      })
      .select()
      .single();

    if (notifError) {
      console.error('❌ Error creando notificación:', notifError.message);
    } else {
      console.log('✅ Notificación creada!');
      console.log('🔔 Notificación:', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message
      });
    }
    
    console.log('\n🎯 Pedido en preparación creado exitosamente!');
    console.log('🌐 Ahora ve a: http://localhost:4321/mis-pedidos');
    console.log('📋 Deberías ver el pedido en preparación');
    console.log('🔔 También deberías ver la notificación');
    console.log('\n📊 Estados del pedido:');
    console.log('   confirmed = En preparación (aparece en Mis Pedidos)');
    console.log('   delivered = Entregado (esperando confirmación)');
    console.log('   completed = Completado (como los anteriores)');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createPendingOrder();

