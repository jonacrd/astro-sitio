import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: true,
    message: 'Endpoint de checkout funcionando'
  }), {
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'POST endpoint de checkout funcionando',
      received: body
    }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};



