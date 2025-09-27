import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      message: 'API funcionando correctamente'
    }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'ERROR',
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};





