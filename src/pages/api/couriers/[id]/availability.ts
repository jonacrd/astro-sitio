// POST /api/couriers/:id/availability - Actualizar disponibilidad del courier
import type { APIRoute } from 'astro';
import { isDeliveryEnabled } from '../../../lib/delivery/getEnv';
import { getDeliveryRepo } from '../../../lib/delivery/repos';
import type { UpdateCourierAvailabilityRequest } from '../../../lib/delivery/types';

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

    const courierId = params.id;
    if (!courierId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Courier ID is required'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const body = await request.json() as UpdateCourierAvailabilityRequest;
    const { isAvailable, lat, lng } = body;

    if (typeof isAvailable !== 'boolean') {
      return new Response(JSON.stringify({
        success: false,
        error: 'isAvailable must be a boolean'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const repo = getDeliveryRepo();

    // Actualizar disponibilidad
    const updates: any = { isAvailable };
    if (lat !== undefined) updates.lastLat = lat;
    if (lng !== undefined) updates.lastLng = lng;

    const result = await repo.updateCourier(courierId, updates);
    
    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Failed to update courier availability'
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
    console.error('Error updating courier availability:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
