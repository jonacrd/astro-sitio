// Endpoint de prueba simple
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔍 Test simple endpoint called');
    
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test simple endpoint working',
      received: body
    }), { status: 200 });

  } catch (error: any) {
    console.error('❌ Error in test simple:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};
