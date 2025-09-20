import type { APIRoute } from 'astro';
import { prisma } from '@/src/lib/db';
import { setSession } from '@/src/lib/session';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async (ctx) => {
  const { name, phone, password } = await ctx.request.json();
  if (!name || !phone || !password) return new Response('Bad Request', { status: 400 });
  
  const exist = await prisma.user.findUnique({ where: { phone } });
  if (exist) return new Response('Phone in use', { status: 409 });
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, phone, passwordHash } });
  setSession(ctx, user.id);
  
  return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
    headers: { 'content-type': 'application/json' } 
  });
};
