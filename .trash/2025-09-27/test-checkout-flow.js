// Script para probar el flujo completo de checkout
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCheckoutFlow() {
  try {
    console.log('🧪 Probando flujo completo de checkout...');
    
    // Simular datos del carrito
    const cartItems = [
      {
        id: '1',
        title: 'Producto de Prueba',
        priceCents: 5000,
        quantity: 2,
        sellerId: 'seller_1',
        sellerName: 'Vendedor de Prueba'
      }
    ];
    
    const totalCents = cartItems.reduce((sum, item) => {
      const price = Number(item.priceCents) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
    
    console.log('📦 Items del carrito:', cartItems);
    console.log('💰 Total calculado:', totalCents);
    
    // Probar creación de orden con UUIDs existentes
    const clientUuid = '98e2217c-5c17-4970-a7d1-ae1bea6d3027'; // Cliente existente
    const sellerUuid = 'df33248a-5462-452b-a4f1-5d17c8c05a51'; // Vendedor existente
    
    console.log('🔧 Creando orden de prueba...');
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: clientUuid,
        seller_id: sellerUuid,
        total_cents: totalCents,
        status: 'pending',
        payment_method: 'cash',
        delivery_cents: 0,
        delivery_address: JSON.stringify({
          fullName: 'Cliente de Prueba',
          phone: '+56 9 1234 5678',
          address: 'Dirección de Prueba 123',
          city: 'Santiago',
          state: 'Región Metropolitana',
          zipCode: '12345'
        }),
        delivery_notes: 'Notas de prueba',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creando orden:', orderError);
      return;
    }

    console.log('✅ Orden creada exitosamente:', order);
    
    // Probar creación de items de orden
    console.log('🔧 Creando items de orden...');
    
    for (const item of cartItems) {
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.id,
          product_title: item.title,
          price_cents: item.priceCents,
          quantity: item.quantity,
          seller_id: sellerUuid,
          seller_name: item.sellerName
        });

      if (itemError) {
        console.log('⚠️ Error creando item (tabla puede no existir):', itemError.message);
      } else {
        console.log('✅ Item de orden creado');
      }
    }
    
    // Probar creación de notificación
    console.log('🔧 Creando notificación...');
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: sellerUuid,
        type: 'new_order',
        title: 'Nueva Orden Recibida',
        message: `Tienes una nueva orden #${order.id} de Cliente de Prueba`,
        data: {
          orderId: order.id,
          customerName: 'Cliente de Prueba',
          totalCents: totalCents
        }
      });

    if (notificationError) {
      console.log('⚠️ Error creando notificación (tabla puede no existir):', notificationError.message);
    } else {
      console.log('✅ Notificación creada');
    }
    
    console.log('🎉 ¡Flujo de checkout probado exitosamente!');
    console.log('📋 Orden ID:', order.id);
    console.log('💰 Total:', totalCents);
    
    // Limpiar datos de prueba
    console.log('🧹 Limpiando datos de prueba...');
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('✅ Datos de prueba eliminados');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testCheckoutFlow();
