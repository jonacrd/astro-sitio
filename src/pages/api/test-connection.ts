// Endpoint de prueba para verificar la conexión
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  console.log('🔍 Test connection endpoint called');
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Test connection working',
    timestamp: new Date().toISOString()
  }), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const POST: APIRoute = async ({ request }) => {
  console.log('🔍 Test connection POST endpoint called');
  
  try {
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test connection POST working',
      received: body,
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('❌ Error in test connection:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
};



