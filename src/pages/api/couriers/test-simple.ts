// Endpoint de prueba simple para verificar que el routing funciona
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔍 Test couriers endpoint called');
    
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test couriers endpoint working',
      received: body
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('❌ Error in test couriers:', error);
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
