// Endpoint para que el vendedor solicite delivery
import type { APIRoute } from 'astro';
import { notifyDeliveryNewOffer } from '../../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, sellerId, pickupAddress, deliveryAddress } = await request.json();
    
    console.log(`🚚 VENDEDOR: Solicitando delivery para pedido ${orderId}`);
    
    // 1. Crear registro de delivery en la base de datos
    // TODO: Implementar creación de delivery en Supabase
    
    // 2. Notificar a todos los couriers activos
    const couriers = [
      { id: 'test-courier-001', name: 'Test Courier', phone: '+56962614851' }
    ];
    
    for (const courier of couriers) {
      await notifyDeliveryNewOffer(
        `DELIVERY_${orderId}`, 
        courier.id, 
        pickupAddress
      );
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Delivery solicitado exitosamente',
      orderId,
      couriersNotified: couriers.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Error solicitando delivery:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
