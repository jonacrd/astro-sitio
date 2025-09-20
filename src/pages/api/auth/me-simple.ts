import type { APIRoute } from 'astro';
import { getUserId } from '@lib/session';

// Datos mock temporales (mismo array que register-simple)
const users: Array<{id: string, name: string, phone: string, passwordHash: string, role: string}> = [];

export const GET: APIRoute = async (ctx) => {
  try {
    const uid = getUserId(ctx);
    if (!uid) return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });
    
    const user = users.find(u => u.id === uid);
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
