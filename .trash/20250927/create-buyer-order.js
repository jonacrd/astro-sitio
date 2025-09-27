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

async function createBuyerOrder() {
  try {
    console.log('🔧 Creando pedido de prueba para el comprador...');
    
    // ID del comprador actual
    const buyerId = '393fdbeb-3536-47e0-8e77-5783e24de0e6';
    
    // ID de un vendedor existente
    const sellerId = '4dd49548-db85-4449-81a5-47d077f7b9ed'; // Vendedor que creamos antes
    
    console.log(`👤 Comprador: ${buyerId}`);
    console.log(`🏪 Vendedor: ${sellerId}`);
    
    // Crear pedido de prueba
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: buyerId,
        seller_id: sellerId,
        total_cents: 45000, // $450.00
        status: 'confirmed', // En preparación
        payment_method: 'efectivo',
        delivery_address: JSON.stringify({
          fullName: 'Comprador Test',
          address: 'Calle Test 456',
          city: 'Ciudad Test',
          state: 'Estado Test',
          zipCode: '54321',
          phone: '0987654321',
          instructions: 'Entregar en la puerta principal'
        }),
        delivery_notes: 'Pedido de prueba para verificar Mis Pedidos'
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
        user_id: buyerId,
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
    
    console.log('\n🎯 Pedido de prueba creado exitosamente!');
    console.log('🌐 Ahora ve a: http://localhost:4321/mis-pedidos');
    console.log('📋 Deberías ver el pedido en preparación');
    console.log('🔔 También deberías ver la notificación');
    console.log('\n📊 Estados del pedido:');
    console.log('   confirmed = En preparación');
    console.log('   delivered = Entregado (esperando confirmación)');
    console.log('   completed = Completado');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createBuyerOrder();

