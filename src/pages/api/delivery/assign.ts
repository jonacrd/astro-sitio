// Endpoint para asignar delivery automáticamente
import type { APIRoute } from 'astro';
import { intelligentAssignmentService } from '../../../lib/delivery/services/IntelligentAssignmentService';

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
