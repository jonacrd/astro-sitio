// Endpoint para probar el sistema real de delivery
import type { APIRoute } from 'astro';
import { getDeliveryRepo } from '../../../lib/delivery/repos';
import { communicationService } from '../../../lib/delivery/services/CommunicationService';
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
    const deliveryRepo = getDeliveryRepo();
    const testPhone = '+56962614851';

    console.log('🧪 Iniciando prueba del sistema real de delivery...');

    switch (testType) {
      case 'create_couriers':
        // Crear repartidores de prueba
        const couriers = [];
        for (let i = 1; i <= 3; i++) {
          const result = await deliveryRepo.createCourier({
            userId: `repartidor${i}@test.com`,
            name: `Repartidor ${i}`,
            phone: testPhone,
            isActive: true,
            isAvailable: true,
          });
          
          if (result.success) {
            couriers.push(result.data);
            console.log(`✅ Repartidor ${i} creado:`, result.data.id);
          } else {
            console.error(`❌ Error creando repartidor ${i}:`, result.error);
          }
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Repartidores creados',
          data: couriers 
        }), { status: 200 });

      case 'create_deliveries':
        // Crear deliveries de prueba
        const deliveries = [];
        for (let i = 1; i <= 3; i++) {
          const result = await deliveryRepo.createDelivery({
            orderId: `REAL_ORDER_${Date.now()}_${i}`,
            sellerId: `vendedor${i}@test.com`,
            courierId: null, // Se asignará después
            status: 'pending',
            pickup: { address: `Calle Test ${i}, Santiago` },
            dropoff: { address: `Av. Mock ${i}, Santiago` },
          });
          
          if (result.success) {
            deliveries.push(result.data);
            console.log(`✅ Delivery ${i} creado:`, result.data.id);
          } else {
            console.error(`❌ Error creando delivery ${i}:`, result.error);
          }
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Deliveries creados',
          data: deliveries 
        }), { status: 200 });

      case 'test_notifications':
        // Probar notificaciones WhatsApp
        const notifications = [
          { type: 'new_order', message: '🛒 NUEVO PEDIDO RECIBIDO' },
          { type: 'delivery_offer', message: '🚚 NUEVA OFERTA DE DELIVERY' },
          { type: 'delivery_confirmed', message: '✅ DELIVERY CONFIRMADO' },
          { type: 'pickup_confirmed', message: '📦 REPARTIDOR EN TU LOCAL' },
          { type: 'on_the_way', message: '🚗 TU PEDIDO VA EN CAMINO' },
          { type: 'delivered', message: '🎉 ¡TU PEDIDO LLEGÓ!' }
        ];

        for (const notification of notifications) {
          await notifySellerNewOrder(testPhone, `TEST_${Date.now()}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Notificaciones de prueba enviadas',
          count: notifications.length 
        }), { status: 200 });

      case 'full_flow':
        // Flujo completo de prueba
        console.log('🚀 Iniciando flujo completo de prueba...');
        
        // 1. Crear repartidor
        const courierResult = await deliveryRepo.createCourier({
          userId: 'test@test.com',
          name: 'Repartidor Test',
          phone: testPhone,
          isActive: true,
          isAvailable: true,
        });
        
        if (!courierResult.success) {
          throw new Error('Error creando repartidor: ' + courierResult.error);
        }
        
        // 2. Crear delivery
        const deliveryResult = await deliveryRepo.createDelivery({
          orderId: `FULL_TEST_${Date.now()}`,
          sellerId: 'vendedor@test.com',
          courierId: courierResult.data.id,
          status: 'pending',
          pickup: { address: 'Calle Test, Santiago' },
          dropoff: { address: 'Av. Mock, Santiago' },
        });
        
        if (!deliveryResult.success) {
          throw new Error('Error creando delivery: ' + deliveryResult.error);
        }
        
        // 3. Enviar notificaciones
        await notifySellerNewOrder(testPhone, deliveryResult.data.orderId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyCourierNewOffer(testPhone, deliveryResult.data.id, 'Calle Test, Santiago');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyDeliveryConfirmed(testPhone, deliveryResult.data.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyPickupConfirmed(testPhone, deliveryResult.data.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyDeliveryOnTheWay(testPhone, deliveryResult.data.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyDeliveryCompleted(testPhone, deliveryResult.data.id);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Flujo completo ejecutado',
          courier: courierResult.data,
          delivery: deliveryResult.data
        }), { status: 200 });

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Tipo de prueba no válido' 
        }), { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Error en prueba del sistema real:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};
