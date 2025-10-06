// Endpoint para obtener deliveries activos de un repartidor
import type { APIRoute } from 'astro';
import { getDeliveryRepo } from '../../../../lib/delivery/repos';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ID de repartidor requerido' 
      }), { status: 400 });
    }

    const deliveryRepo = getDeliveryRepo();

    // Obtener deliveries activos del repartidor
    const result = await deliveryRepo.getActiveOffersForCourier(id);

    if (!result.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error 
      }), { status: 400 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: result.data 
    }), { status: 200 });

  } catch (error: any) {
    console.error('Error getting courier deliveries:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};
