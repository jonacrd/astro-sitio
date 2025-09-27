import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: false,
    error: 'This endpoint has been replaced with Supabase implementation. Please use the new Supabase endpoints.'
  }), {
    status: 410, // Gone
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: false,
    error: 'This endpoint has been replaced with Supabase implementation. Please use the new Supabase endpoints.'
  }), {
    status: 410, // Gone
    headers: { 'content-type': 'application/json' }
  });
};




