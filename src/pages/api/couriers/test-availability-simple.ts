// Endpoint de prueba simple para verificar el routing de couriers
import type { APIRoute } from 'astro';
import { getDeliveryRepo } from '../../../lib/delivery/repos';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔍 Test couriers simple endpoint called');
    
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    const deliveryRepo = getDeliveryRepo();
    console.log('🔍 Delivery repo obtained:', !!deliveryRepo);
    
    // Crear un courier de prueba
    const result = await deliveryRepo.createCourier({
      userId: 'test-simple@test.com',
      name: 'Test Simple',
      phone: '+56912345678',
      isActive: true,
      isAvailable: false,
    });

    console.log('🔍 Create result:', result);

    if (!result.success) {
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

    // Intentar actualizar el courier
    const updateResult = await deliveryRepo.updateCourier(result.data.id, {
      isAvailable: true,
    });

    console.log('🔍 Update result:', updateResult);

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        created: result.data,
        updated: updateResult.data
      }
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('❌ Error in test couriers simple:', error);
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



