import type { APIRoute } from 'astro';
import { setSession } from '@lib/session';
import { userRepo } from '@lib/repos';

export const POST: APIRoute = async (ctx) => {
  try {
    const { name, phone, password } = await ctx.request.json();
    if (!name || !phone || !password) return new Response('Bad Request', { status: 400 });

    // Verificar si el teléfono ya existe
    const exist = await userRepo.findByPhone(phone);
    if (exist) return new Response('Phone in use', { status: 409 });
    
    // Crear usuario (en modo mock, sin hash de contraseña)
    const user = await userRepo.create({
      name,
      phone,
      passwordHash: password, // Sin hash en modo mock
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

