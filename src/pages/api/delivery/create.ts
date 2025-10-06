// POST /api/delivery/create - Crear nuevo delivery
import type { APIRoute } from 'astro';
import { isDeliveryEnabled } from '../../../lib/delivery/getEnv';
import { getDeliveryRepo } from '../../../lib/delivery/repos';
import { assignmentService } from '../../../lib/delivery/services/AssignmentService';
import type { CreateDeliveryRequest } from '../../../lib/delivery/types';

export const POST: APIRoute = async ({ request }) => {
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

    const body = await request.json() as CreateDeliveryRequest;
    const { orderId, sellerId, pickup, dropoff } = body;

    // Validar datos requeridos
    if (!orderId || !sellerId || !pickup?.address || !dropoff?.address) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: orderId, sellerId, pickup.address, dropoff.address'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const repo = getDeliveryRepo();

    // Crear delivery
    const deliveryResult = await repo.createDelivery({
      orderId,
      sellerId,
      status: 'pending',
      pickup,
      dropoff,
    });

    if (!deliveryResult.success || !deliveryResult.data) {
      return new Response(JSON.stringify({
        success: false,
        error: deliveryResult.error || 'Failed to create delivery'
      }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const delivery = deliveryResult.data;

    // Iniciar proceso de asignación
    const assignmentResult = await assignmentService.tryNextCourier(delivery.id);
    
    if (!assignmentResult.success) {
      console.error('Assignment failed:', assignmentResult.error);
      // No fallar la creación del delivery, solo loggear
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        delivery,
        assignmentStarted: assignmentResult.success
      }
    }), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating delivery:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
