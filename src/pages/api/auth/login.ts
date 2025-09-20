import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { setSession } from '@lib/session';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async (ctx) => {
  const { phone, password } = await ctx.request.json();
  if (!phone || !password) return new Response('Bad Request', { status: 400 });
  
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return new Response('Invalid credentials', { status: 401 });
  
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return new Response('Invalid credentials', { status: 401 });
  
  setSession(ctx, user.id);
  
  return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
    headers: { 'content-type': 'application/json' } 
  });
};
