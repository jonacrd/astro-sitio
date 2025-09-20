import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { getUserId } from '@lib/session';

export const POST: APIRoute = async (ctx) => {
  const uid = getUserId(ctx);
  if (!uid) return new Response('Unauthorized', { status: 401 });
  
  const { storeName } = await ctx.request.json();
  if (!storeName) return new Response('Bad Request', { status: 400 });
  
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
};
