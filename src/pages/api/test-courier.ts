// Endpoint de prueba para couriers
import type { APIRoute } from 'astro';
import { getDeliveryRepo } from '../../lib/delivery/repos';

export const GET: APIRoute = async () => {
  try {
    const deliveryRepo = getDeliveryRepo();
    
    // Crear un courier de prueba
    const result = await deliveryRepo.createCourier({
      userId: 'test@test.com',
      name: 'Test Courier',
      phone: '+56912345678',
      isActive: true,
      isAvailable: false,
    });

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
    console.error('Error creating test courier:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};

