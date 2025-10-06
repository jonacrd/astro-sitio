// POST /api/deliveries/:id/status - Actualizar estado del delivery
import type { APIRoute } from 'astro';
import { isDeliveryEnabled } from '../../../lib/delivery/getEnv';
import { getDeliveryRepo } from '../../../lib/delivery/repos';
import { notifyCustomerStatusUpdate, notifyDeliveryCompleted } from '../../../lib/delivery/services/notify';
import type { UpdateDeliveryStatusRequest, DeliveryStatus } from '../../../lib/delivery/types';

const VALID_STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['offer_sent', 'no_courier', 'cancelled'],
  offer_sent: ['assigned', 'no_courier', 'cancelled'],
  assigned: ['pickup_confirmed', 'cancelled'],
  pickup_confirmed: ['en_route', 'cancelled'],
  en_route: ['delivered', 'cancelled'],
  delivered: [], // Estado final
  no_courier: ['pending'], // Puede reintentarse
  cancelled: [], // Estado final
};

export const POST: APIRoute = async ({ params, request }) => {
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

    const deliveryId = params.id;
    if (!deliveryId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Delivery ID is required'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const body = await request.json() as UpdateDeliveryStatusRequest;
    const { status } = body;

    if (!status || !Object.keys(VALID_STATUS_TRANSITIONS).includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid status'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const repo = getDeliveryRepo();

    // Obtener delivery actual
    const currentDeliveryResult = await repo.getDelivery(deliveryId);
    if (!currentDeliveryResult.success || !currentDeliveryResult.data) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Delivery not found'
      }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    const currentDelivery = currentDeliveryResult.data;

    // Verificar transición válida
    const validTransitions = VALID_STATUS_TRANSITIONS[currentDelivery.status];
    if (!validTransitions.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid status transition from ${currentDelivery.status} to ${status}`
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Actualizar estado
    const result = await repo.updateDelivery(deliveryId, { status });
    
    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Failed to update delivery status'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const updatedDelivery = result.data!;

    // Enviar notificaciones según el estado
    if (updatedDelivery.courierId) {
      const courierResult = await repo.getCourier(updatedDelivery.courierId);
      if (courierResult.success && courierResult.data) {
        if (status === 'delivered') {
          await notifyDeliveryCompleted(updatedDelivery, courierResult.data);
        } else {
          await notifyCustomerStatusUpdate(updatedDelivery, courierResult.data);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: updatedDelivery
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error updating delivery status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
