// Endpoint de prueba simple
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('🔍 Test endpoint called with:', body);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test endpoint working',
      received: body
    }), { status: 200 });

  } catch (error: any) {
    console.error('❌ Error in test endpoint:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};



