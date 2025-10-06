// Endpoint de prueba rápida para sistema de delivery
import type { APIRoute } from 'astro';
import { 
  notifySellerNewOrder, 
  notifyCourierNewOffer, 
  notifyDeliveryConfirmed, 
  notifyPickupConfirmed, 
  notifyDeliveryOnTheWay, 
  notifyDeliveryCompleted 
} from '../../../server/whatsapp-simple';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { testType } = await request.json();
    const testPhone = '+56962614851';

    console.log('🧪 Iniciando prueba rápida del sistema de delivery...');

    switch (testType) {
      case 'notifications':
        // Probar todas las notificaciones
        console.log('📱 Enviando notificaciones de prueba...');
        
        await notifySellerNewOrder(testPhone, 'TEST_ORDER_001');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyCourierNewOffer(testPhone, 'TEST_DELIVERY_001', 'Calle Test, Santiago');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyDeliveryConfirmed(testPhone, testPhone, 'TEST_DELIVERY_001');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyPickupConfirmed(testPhone, testPhone, 'TEST_DELIVERY_001');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyDeliveryOnTheWay(testPhone, 'TEST_DELIVERY_001');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyDeliveryCompleted(testPhone, testPhone, 'TEST_DELIVERY_001');
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Notificaciones de prueba enviadas a +56962614851',
          notifications: [
            '🛒 Nuevo pedido recibido',
            '🚚 Nueva oferta de delivery',
            '✅ Delivery confirmado',
            '📦 Repartidor en tu local',
            '🚗 Tu pedido va en camino',
            '🎉 ¡Tu pedido llegó!'
          ]
        }), { status: 200 });

      case 'delivery_flow':
        // Simular flujo completo de delivery
        console.log('🚀 Simulando flujo completo de delivery...');
        
        const orderId = `REAL_ORDER_${Date.now()}`;
        const deliveryId = `REAL_DELIVERY_${Date.now()}`;
        
        // 1. Nuevo pedido (vendedor)
        await notifySellerNewOrder(testPhone, orderId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. Oferta de delivery (repartidor)
        await notifyCourierNewOffer(testPhone, deliveryId, 'Calle Test 123, Santiago');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Delivery confirmado (vendedor y comprador)
        await notifyDeliveryConfirmed(testPhone, testPhone, deliveryId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 4. Repartidor en local (vendedor)
        await notifyPickupConfirmed(testPhone, testPhone, deliveryId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 5. En camino (comprador)
        await notifyDeliveryOnTheWay(testPhone, deliveryId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 6. Entregado (todos)
        await notifyDeliveryCompleted(testPhone, testPhone, deliveryId);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Flujo completo de delivery simulado',
          orderId,
          deliveryId,
          steps: [
            '1. Nuevo pedido → Vendedor',
            '2. Oferta de delivery → Repartidor',
            '3. Delivery confirmado → Vendedor y Comprador',
            '4. Repartidor en local → Vendedor',
            '5. En camino → Comprador',
            '6. Entregado → Todos'
          ]
        }), { status: 200 });

      case 'multiple_deliveries':
        // Crear 3 deliveries de prueba
        console.log('📦 Creando 3 deliveries de prueba...');
        
        const deliveries = [];
        for (let i = 1; i <= 3; i++) {
          const orderId = `DELIVERY_${i}_${Date.now()}`;
          const deliveryId = `DELIVERY_ID_${i}_${Date.now()}`;
          
          // Notificar nuevo pedido
          await notifySellerNewOrder(testPhone, orderId);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          deliveries.push({
            orderId,
            deliveryId,
            status: 'created'
          });
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: '3 deliveries de prueba creados',
          deliveries,
          phone: testPhone
        }), { status: 200 });

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Tipo de prueba no válido. Usa: notifications, delivery_flow, multiple_deliveries' 
        }), { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Error en prueba rápida:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};
