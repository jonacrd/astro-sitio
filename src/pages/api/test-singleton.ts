// Endpoint de prueba para verificar el singleton
import type { APIRoute } from 'astro';
import { getDeliveryRepo } from '../../lib/delivery/repos';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Test singleton endpoint called');
    
    const deliveryRepo = getDeliveryRepo();
    console.log('🔍 Delivery repo obtained:', !!deliveryRepo);
    
    // Crear un courier de prueba
    const result = await deliveryRepo.createCourier({
      userId: 'test-singleton@test.com',
      name: 'Test Singleton',
      phone: '+56912345678',
      isActive: true,
      isAvailable: false,
    });

    console.log('🔍 Create result:', result);

    if (!result.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error 
      }), { status: 400 });
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
    }), { status: 200 });

  } catch (error: any) {
    console.error('❌ Error in test singleton:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};



