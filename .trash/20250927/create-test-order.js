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

async function createTestOrder() {
  try {
    console.log('🔧 Creando pedido de prueba para el vendedor...');
    
    // ID del vendedor actual
    const sellerId = '4dd49548-db85-4449-81a5-47d077f7b9ed';
    
    // ID de un comprador existente
    const buyerId = '98e2217c-5c17-4970-a7d1-ae1bea6d3027';
    
    console.log(`🏪 Vendedor: ${sellerId}`);
    console.log(`👤 Comprador: ${buyerId}`);
    
    // Crear pedido de prueba
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: buyerId,
        seller_id: sellerId,
        total_cents: 25000, // $250.00
        status: 'confirmed',
        payment_method: 'efectivo',
        delivery_address: JSON.stringify({
          fullName: 'Comprador Test',
          address: 'Calle Test 123',
          city: 'Ciudad Test',
          state: 'Estado Test',
          zipCode: '12345',
          phone: '1234567890',
          instructions: 'Entregar en la puerta'
        }),
        delivery_notes: 'Pedido de prueba para verificar dashboard'
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
    
    // Crear item del pedido
    console.log('📦 Creando item del pedido...');
    
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: 'p_test_product',
        quantity: 2,
        price_cents: 12500 // $125.00 por unidad
      })
      .select()
      .single();

    if (itemError) {
      console.error('❌ Error creando item del pedido:', itemError.message);
    } else {
      console.log('✅ Item del pedido creado!');
      console.log('📦 Item:', {
        id: orderItem.id,
        product: orderItem.product_id,
        quantity: orderItem.quantity,
        price: `$${(orderItem.price_cents / 100).toFixed(2)}`
      });
    }
    
    // Crear notificación para el vendedor
    console.log('🔔 Creando notificación para el vendedor...');
    
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: sellerId,
        type: 'new_order',
        title: '¡Nuevo Pedido!',
        message: `Tienes un nuevo pedido por $${(order.total_cents / 100).toFixed(2)}`,
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
    console.log('🌐 Ahora ve a: http://localhost:4321/dashboard/pedidos');
    console.log('📋 Deberías ver el pedido confirmado en el dashboard');
    console.log('🔔 También deberías ver la notificación');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createTestOrder();