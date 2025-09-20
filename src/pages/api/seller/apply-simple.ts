import type { APIRoute } from 'astro';
import { getUserId } from '@lib/session';
import { findUserById, createSeller } from '@lib/memory-storage';

export const POST: APIRoute = async (ctx) => {
  try {
    const uid = getUserId(ctx);
    if (!uid) return new Response('Unauthorized', { status: 401 });
    
    const { storeName } = await ctx.request.json();
    if (!storeName) return new Response('Bad Request', { status: 400 });
    
    const user = findUserById(uid);
    if (!user) return new Response('User not found', { status: 404 });
    
    // Actualizar rol del usuario
    user.role = 'SELLER';
    
    // Crear seller
    createSeller({
      userId: uid,
      storeName,
      online: false,
      deliveryEnabled: true,
      deliveryETA: '30-40m'
    });
    
    return new Response(JSON.stringify({ ok: true, role: user.role }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (error) {
    console.error('Seller apply error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

