import type { APIRoute } from 'astro';
import { setSession } from '@lib/session';

// Datos mock temporales para desarrollo
const users: Array<{id: string, name: string, phone: string, passwordHash: string, role: string}> = [];

export const POST: APIRoute = async (ctx) => {
  try {
    const { name, phone, password } = await ctx.request.json();
    if (!name || !phone || !password) return new Response('Bad Request', { status: 400 });
    
    // Verificar si el teléfono ya existe
    const exist = users.find(u => u.phone === phone);
    if (exist) return new Response('Phone in use', { status: 409 });
    
    // Crear usuario (simplificado, sin hash por ahora)
    const userId = 'user_' + Date.now();
    const user = { 
      id: userId, 
      name, 
      phone, 
      passwordHash: password, // Temporal: sin hash
      role: 'CUSTOMER' 
    };
    
    users.push(user);
    setSession(ctx, userId);
    
    return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (error) {
    console.error('Register error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
