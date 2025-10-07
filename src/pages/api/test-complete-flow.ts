// Endpoint para probar el flujo completo de notificaciones WhatsApp
import type { APIRoute } from 'astro';
import { 
  notifySellerNewOrder, 
  notifyCustomerOrderConfirmed, 
  notifyDeliveryNewOffer, 
  notifyDeliveryStatus 
} from '../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🧪 TESTING: Iniciando flujo completo de notificaciones WhatsApp');
    
    let testPhone = '+56962614851';
    try {
      const body = await request.json();
      testPhone = body.testPhone || testPhone;
    } catch {
      // Si no hay JSON, usar valor por defecto
    }
    
    // 1. SIMULAR NUEVO PEDIDO - NOTIFICAR VENDEDOR
    console.log('🛒 PASO 1: Notificando vendedor sobre nuevo pedido');
    await notifySellerNewOrder('TEST_ORDER_001', 'test_seller_id');
    
    // 2. SIMULAR CONFIRMACIÓN - NOTIFICAR CLIENTE
    console.log('✅ PASO 2: Notificando cliente sobre confirmación');
    await notifyCustomerOrderConfirmed('TEST_ORDER_001', 'test_customer_id');
    
    // 3. SIMULAR OFERTA DE DELIVERY - NOTIFICAR DELIVERY
    console.log('🚚 PASO 3: Notificando delivery sobre nueva oferta');
    await notifyDeliveryNewOffer('TEST_DELIVERY_001', 'test_courier_id', 'Calle Test 123, Santiago');
    
    // 4. SIMULAR STATUS DE DELIVERY - NOTIFICAR AMBOS
    console.log('📦 PASO 4: Notificando status de delivery');
    await notifyDeliveryStatus('TEST_DELIVERY_001', 'assigned', 'test_seller_id', 'test_customer_id');
    
    console.log('✅ TESTING: Flujo completo ejecutado exitosamente');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Flujo completo de notificaciones WhatsApp ejecutado',
      steps: [
        '1. Vendedor notificado sobre nuevo pedido',
        '2. Cliente notificado sobre confirmación', 
        '3. Delivery notificado sobre nueva oferta',
        '4. Status de delivery notificado a vendedor y cliente'
      ],
      testPhone,
      note: 'Revisa la consola del servidor para ver los logs de WhatsApp'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ TESTING: Error en flujo completo:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
