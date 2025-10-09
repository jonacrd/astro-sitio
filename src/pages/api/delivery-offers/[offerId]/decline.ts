// POST /api/delivery-offers/:offerId/decline - Rechazar oferta
import type { APIRoute } from 'astro';
import { isDeliveryEnabled } from '../../../../lib/delivery/getEnv';
import { assignmentService } from '../../../../lib/delivery/services/AssignmentService';

export const POST: APIRoute = async ({ params }) => {
  try {
    // Verificar feature flag
    if (!isDeliveryEnabled()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Delivery feature is disabled'
      }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    const offerId = params.offerId;
    if (!offerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Offer ID is required'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Rechazar oferta
    const result = await assignmentService.declineOffer(offerId);
    
    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Failed to decline offer'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error declining offer:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};


