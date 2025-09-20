import type { APIRoute } from 'astro';
import { setSession } from '@lib/session';
import { findUserByPhone, createUser } from '@lib/memory-storage';

export const POST: APIRoute = async (ctx) => {
  try {
    const { name, phone, password } = await ctx.request.json();
    if (!name || !phone || !password) return new Response('Bad Request', { status: 400 });
    
    // Verificar si el teléfono ya existe
    const exist = findUserByPhone(phone);
    if (exist) return new Response('Phone in use', { status: 409 });
    
    // Crear usuario
    const user = createUser({
      name,
      phone,
      passwordHash: password, // Temporal: sin hash
      role: 'CUSTOMER'
    });
    
    setSession(ctx, user.id);
    
    return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (error) {
    console.error('Register error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
