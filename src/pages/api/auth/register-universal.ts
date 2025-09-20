import type { APIRoute } from 'astro';
import { setSession } from '@lib/session';

// Detectar si estamos en Vercel (producción)
const isVercel = () => process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export const POST: APIRoute = async (ctx) => {
  try {
    const { name, phone, password } = await ctx.request.json();
    if (!name || !phone || !password) return new Response('Bad Request', { status: 400 });

    if (isVercel()) {
      // En Vercel, usar base de datos PostgreSQL
      const { PrismaClient } = await import('@prisma/client');
      const bcrypt = await import('bcryptjs');
      
      const prisma = new PrismaClient();
      
      try {
        // Verificar si el teléfono ya existe
        const exist = await prisma.user.findUnique({ where: { phone } });
        if (exist) return new Response('Phone in use', { status: 409 });
        
        // Crear usuario con hash de contraseña
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ 
          data: { name, phone, passwordHash, role: 'CUSTOMER' } 
        });
        
        setSession(ctx, user.id);
        
        return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
          headers: { 'content-type': 'application/json' } 
        });
      } finally {
        await prisma.$disconnect();
      }
    } else {
      // En desarrollo local, usar almacenamiento en memoria
      const { findUserByPhone, createUser } = await import('@lib/memory-storage');
      
      const exist = findUserByPhone(phone);
      if (exist) return new Response('Phone in use', { status: 409 });
      
      const user = createUser({
        name,
        phone,
        passwordHash: password, // Sin hash en desarrollo
        role: 'CUSTOMER'
      });
      
      setSession(ctx, user.id);
      
      return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
        headers: { 'content-type': 'application/json' } 
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
