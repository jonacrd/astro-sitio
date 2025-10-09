// Endpoint de prueba para verificar el routing
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔍 Test routing endpoint called');
    
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test routing endpoint working',
      received: body
    }), { status: 200 });

  } catch (error: any) {
    console.error('❌ Error in test routing:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};

