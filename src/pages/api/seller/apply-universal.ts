import type { APIRoute } from 'astro';
import { getUserId } from '@lib/session';

// Detectar si estamos en Vercel (producción)
const isVercel = () => process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export const POST: APIRoute = async (ctx) => {
  try {
    const uid = getUserId(ctx);
    if (!uid) return new Response('Unauthorized', { status: 401 });
    
    const { storeName } = await ctx.request.json();
    if (!storeName) return new Response('Bad Request', { status: 400 });

    if (isVercel()) {
      // En Vercel, usar base de datos PostgreSQL
      const { PrismaClient } = await import('@prisma/client');
      
      const prisma = new PrismaClient();
      
      try {
        const user = await prisma.user.update({ 
          where: { id: uid }, 
          data: { role: 'SELLER' } 
        });
        
        await prisma.seller.upsert({ 
          where: { userId: uid }, 
          update: { storeName }, 
          create: { userId: uid, storeName } 
        });
        
        return new Response(JSON.stringify({ ok: true, role: user.role }), { 
          headers: { 'content-type': 'application/json' } 
        });
      } finally {
        await prisma.$disconnect();
      }
    } else {
      // En desarrollo local, usar almacenamiento en memoria
      const { findUserById, createSeller } = await import('@lib/memory-storage');
      
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
    }
  } catch (error) {
    console.error('Seller apply error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
