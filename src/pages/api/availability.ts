// Endpoint para actualizar disponibilidad de un repartidor
import type { APIRoute } from 'astro';
import { getDeliveryRepo } from '../../lib/delivery/repos';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔍 API availability endpoint called');
    
    const requestBody = await request.json();
    console.log('🔍 Request body:', requestBody);
    
    const { id, isAvailable, lat, lng } = requestBody;
    console.log('🔍 Extracted values:', { id, isAvailable, lat, lng });

    if (!id) {
      console.log('❌ No ID provided');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ID de repartidor requerido' 
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const deliveryRepo = getDeliveryRepo();
    console.log('🔍 Delivery repo obtained:', !!deliveryRepo);

    // Actualizar disponibilidad del repartidor
    const result = await deliveryRepo.updateCourier(id, {
      isAvailable,
      lastLat: lat,
      lastLng: lng,
    });

    console.log('🔍 Update result:', result);

    if (!result.success) {
      console.log('❌ Update failed:', result.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error 
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('✅ Update successful:', result.data);
    return new Response(JSON.stringify({ 
      success: true, 
      data: result.data 
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('❌ Error updating courier availability:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};


