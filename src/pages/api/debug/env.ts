import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    url: process.env.PUBLIC_SUPABASE_URL,
    anonPrefix: (process.env.PUBLIC_SUPABASE_ANON_KEY || '').slice(0, 10),
  }), { 
    headers: { 'content-type': 'application/json' }
  });
};
