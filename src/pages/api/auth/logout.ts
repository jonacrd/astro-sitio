import type { APIRoute } from 'astro';
import { clearSession } from '@lib/session';

export const POST: APIRoute = async (ctx) => { 
  clearSession(ctx); 
  return new Response(JSON.stringify({ ok: true }), { 
    headers: { 'content-type': 'application/json' } 
  }); 
};
