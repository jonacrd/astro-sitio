import type { APIRoute } from 'astro';
import { getUserId } from '@lib/session';

// Detectar si estamos en Vercel (producción)
const isVercel = () => process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export const GET: APIRoute = async (ctx) => {
  try {
    const uid = getUserId(ctx);
    if (!uid) return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });

    if (isVercel()) {
      // En Vercel, usar base de datos PostgreSQL
      const { PrismaClient } = await import('@prisma/client');
      
      const prisma = new PrismaClient();
      
      try {
        const user = await prisma.user.findUnique({ 
          where: { id: uid },
          include: { seller: true }
        });
        
        if (!user) return new Response(JSON.stringify({ user: null }), { 
          headers: { 'content-type': 'application/json' } 
        });
        
        // Devolver usuario sin passwordHash
        const { passwordHash, ...userSafe } = user;
        
        return new Response(JSON.stringify({ user: userSafe }), { 
          headers: { 'content-type': 'application/json' } 
        });
      } finally {
        await prisma.$disconnect();
      }
    } else {
      // En desarrollo local, usar almacenamiento en memoria
      const { findUserById } = await import('@lib/memory-storage');
      
      const user = findUserById(uid);
      if (!user) return new Response(JSON.stringify({ user: null }), { 
        headers: { 'content-type': 'application/json' } 
      });
      
      // Devolver usuario sin passwordHash
      const { passwordHash, ...userSafe } = user;
      
      return new Response(JSON.stringify({ user: userSafe }), { 
        headers: { 'content-type': 'application/json' } 
      });
    }
  } catch (error) {
    console.error('Me error:', error);
    return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });
  }
};
