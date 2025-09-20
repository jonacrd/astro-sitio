import type { APIRoute } from 'astro';
import { getUserId } from '@lib/session';
import { findUserById } from '@lib/memory-storage';

export const GET: APIRoute = async (ctx) => {
  try {
    const uid = getUserId(ctx);
    if (!uid) return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });
    
    const user = findUserById(uid);
    if (!user) return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });
    
    // Devolver usuario sin passwordHash
    const { passwordHash, ...userSafe } = user;
    
    return new Response(JSON.stringify({ user: userSafe }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (error) {
    console.error('Me error:', error);
    return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });
  }
};
