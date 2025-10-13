// Endpoint para que el courier acepte un delivery
import type { APIRoute } from 'astro';
import { sendWhatsAppAutomation } from '../../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { deliveryId, courierId, orderId, sellerId, customerId } = await request.json();
    
    console.log(`✅ COURIER: Aceptando delivery ${deliveryId}`);
    
    // 1. Actualizar estado del delivery en la base de datos
    // TODO: Implementar actualización en Supabase
    
    // 2. Notificar al vendedor que el courier aceptó
    const sellerMessage = `🚚 DELIVERY CONFIRMADO\n\nID: ${deliveryId}\nEl repartidor ${courierId} confirmó el viaje y está yendo a buscarlo.`;
    await sendWhatsAppAutomation('+56962614851', sellerMessage);
    
    // 3. Notificar al cliente sobre el courier asignado
    const customerMessage = `📦 TU PEDIDO TIENE REPARTIDOR\n\nID: ${orderId}\nCourier: ${courierId}\n\nLink de seguimiento: https://tuapp.com/track/${orderId}`;
    await sendWhatsAppAutomation('+56962614851', customerMessage);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Delivery aceptado exitosamente',
      deliveryId,
      courierId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Error aceptando delivery:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};





