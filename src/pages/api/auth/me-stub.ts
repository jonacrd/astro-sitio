import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: false,
    error: 'This endpoint has been replaced with Supabase Auth. Use /api/auth/supabase endpoints instead.'
  }), {
    status: 410, // Gone
    headers: { 'content-type': 'application/json' }
  });
};
