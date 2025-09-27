import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createRealOrderSimple() {
  try {
    console.log('🛒 Creando pedido REAL usando método directo...');
    
    const comprador1Id = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1@gmail.com
    const techstoreId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore.digital@gmail.com
    
    console.log(`👤 Comprador: ${comprador1Id}`);
    console.log(`🏪 Vendedor: ${techstoreId}`);
    
    // 1. Crear pedido directamente sin carrito (como los anteriores exitosos)
    console.log('\n📋 Creando pedido directamente...');
    
    const totalCents = 650000; // $6,500 (mayor a $5,000 para activar puntos)
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: comprador1Id,
        seller_id: techstoreId,
        total_cents: totalCents,
        status: 'pending',
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
        delivery_notes: 'Pedido real de prueba con sistema de puntos'
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creando pedido:', orderError);
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
    
    // 2. Crear items del pedido (simulando productos comprados)
    console.log('\n📦 Agregando items al pedido...');
    
    const orderItems = [
      {
        order_id: order.id,
        product_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // UUID ficticio
        title: 'Cable USB-C Premium',
        price_cents: 250000,
        qty: 2
      },
      {
        order_id: order.id,
        product_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', // UUID ficticio
        title: 'Power Bank 20000mAh',
        price_cents: 150000,
        qty: 1
      }
    ];
    
    // Verificar si existe tabla order_items
    try {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.log('⚠️ Error agregando items (tabla order_items puede no existir):', itemsError.message);
        console.log('✅ Pedido creado sin items detallados');
      } else {
        console.log('✅ Items agregados al pedido');
      }
    } catch (err) {
      console.log('⚠️ Tabla order_items no disponible');
    }
    
    // 3. Confirmar pedido automáticamente
    console.log('\n🔄 Confirmando pedido (cambiar a confirmed)...');
    
    const { error: confirmError } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', order.id);
    
    if (confirmError) {
      console.error('❌ Error confirmando pedido:', confirmError);
    } else {
      console.log('✅ Pedido confirmado (estado: confirmed - en preparación)');
      
      // Crear notificación para el comprador
      await supabase.from('notifications').insert({
        user_id: comprador1Id,
        type: 'order_confirmed',
        title: '¡Pedido Confirmado!',
        message: `Tu pedido por $${(totalCents / 100).toFixed(2)} ha sido confirmado por TechStore y está en preparación`,
        order_id: order.id,
        is_read: false
      });
      
      console.log('📧 Notificación creada para el comprador');
    }
    
    console.log('\n🎯 PEDIDO REAL CREADO EXITOSAMENTE!');
    console.log('📊 Resumen:');
    console.log(`   - Pedido ID: ${order.id}`);
    console.log(`   - Total: $${(totalCents / 100).toFixed(2)}`);
    console.log(`   - Estado: confirmed (en preparación)`);
    console.log(`   - Sistema de recompensas: ACTIVO (>$5,000)`);
    
    console.log('\n🔧 PRÓXIMO PASO:');
    console.log('1. Ejecutar SQL en Supabase Dashboard para crear funciones:');
    console.log('   - confirm_delivery_by_seller()');
    console.log('   - confirm_receipt_by_buyer()');
    
    console.log('\n🌐 Luego puedes:');
    console.log('1. Ver el pedido en el dashboard del vendedor (/dashboard/pedidos)');
    console.log('2. Ver el pedido en Mis Pedidos del comprador (/mis-pedidos)');
    console.log('3. El vendedor puede marcar como "entregado" y asignar puntos automáticamente');
    console.log('4. El comprador recibirá puntos cuando se confirme la entrega');
    
    return order.id;
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createRealOrderSimple();

