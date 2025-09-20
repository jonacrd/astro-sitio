import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { getUserId } from '@lib/session';

export const GET: APIRoute = async (ctx) => {
  const uid = getUserId(ctx);
  if (!uid) return new Response(JSON.stringify({ user: null }), { 
    headers: { 'content-type': 'application/json' } 
  });
  
  const user = await prisma.user.findUnique({ 
    where: { id: uid }, 
    include: { seller: true } 
  });
  
  return new Response(JSON.stringify({ user }), { 
    headers: { 'content-type': 'application/json' } 
  });
};
