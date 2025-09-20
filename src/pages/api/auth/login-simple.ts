import type { APIRoute } from 'astro';
import { setSession } from '@lib/session';
import { findUserByPhone } from '@lib/memory-storage';

export const POST: APIRoute = async (ctx) => {
  try {
    const { phone, password } = await ctx.request.json();
    if (!phone || !password) return new Response('Bad Request', { status: 400 });
    
    const user = findUserByPhone(phone);
    if (!user) return new Response('Invalid credentials', { status: 401 });
    
    // Comparación simple (temporal: sin hash)
    if (user.passwordHash !== password) return new Response('Invalid credentials', { status: 401 });
    
    setSession(ctx, user.id);
    
    return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
