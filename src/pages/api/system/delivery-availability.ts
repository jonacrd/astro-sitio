// GET /api/system/delivery-availability - Verificar disponibilidad de couriers
import type { APIRoute } from 'astro';
import { isDeliveryEnabled } from '../../../lib/delivery/getEnv';
import { getDeliveryRepo } from '../../../lib/delivery/repos';
import type { DeliveryAvailabilityResponse } from '../../../lib/delivery/types';

export const GET: APIRoute = async () => {
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

    const repo = getDeliveryRepo();

    // Obtener couriers disponibles
    const availableResult = await repo.getAvailableCouriers();
    if (!availableResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: availableResult.error || 'Failed to get available couriers'
      }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const availableCouriers = availableResult.data || [];
    const totalCount = await repo.getCouriersCount();

    const response: DeliveryAvailabilityResponse = {
      anyAvailable: availableCouriers.length > 0,
      count: availableCouriers.length
    };

    return new Response(JSON.stringify({
      success: true,
      data: response,
      meta: {
        totalCouriers: totalCount,
        availableCouriers: availableCouriers.length
      }
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error checking delivery availability:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
