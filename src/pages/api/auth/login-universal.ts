import type { APIRoute } from 'astro';
import { setSession } from '@lib/session';

// Detectar si estamos en Vercel (producción)
const isVercel = () => process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export const POST: APIRoute = async (ctx) => {
  try {
    const { phone, password } = await ctx.request.json();
    if (!phone || !password) return new Response('Bad Request', { status: 400 });

    if (isVercel()) {
      // En Vercel, usar base de datos PostgreSQL
      const { PrismaClient } = await import('@prisma/client');
      const bcrypt = await import('bcryptjs');
      
      const prisma = new PrismaClient();
      
      try {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) return new Response('Invalid credentials', { status: 401 });
        
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return new Response('Invalid credentials', { status: 401 });
        
        setSession(ctx, user.id);
        
        return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
          headers: { 'content-type': 'application/json' } 
        });
      } finally {
        await prisma.$disconnect();
      }
    } else {
      // En desarrollo local, usar almacenamiento en memoria
      const { findUserByPhone } = await import('@lib/memory-storage');
      
      const user = findUserByPhone(phone);
      if (!user) return new Response('Invalid credentials', { status: 401 });
      
      if (user.passwordHash !== password) return new Response('Invalid credentials', { status: 401 });
      
      setSession(ctx, user.id);
      
      return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
        headers: { 'content-type': 'application/json' } 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
