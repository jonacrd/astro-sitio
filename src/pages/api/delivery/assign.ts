// Endpoint para asignar delivery automáticamente
import type { APIRoute } from 'astro';
import { intelligentAssignmentService } from '../../../lib/delivery/services/IntelligentAssignmentService';
import { notifyDeliveryNewOffer } from '../../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { deliveryId, strategy = 'round_robin' } = await request.json();

    if (!deliveryId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Delivery ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await intelligentAssignmentService.assignDelivery(deliveryId, strategy);

    // NOTIFICAR AUTOMÁTICAMENTE AL DELIVERY VÍA WHATSAPP
    if (result.success && result.data?.courierId) {
      try {
        await notifyDeliveryNewOffer(
          deliveryId, 
          result.data.courierId, 
          result.data.pickupAddress || 'Dirección de recogida'
        );
        console.log('✅ AUTOMÁTICO: Delivery notificado vía WhatsApp');
      } catch (waError) {
        console.error('❌ AUTOMÁTICO: Error notificando delivery:', waError);
        // No fallar la asignación si falla WhatsApp
      }
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
