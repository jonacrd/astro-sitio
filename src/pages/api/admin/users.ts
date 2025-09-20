import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { getUserId } from '@lib/session';

async function requireAdmin(ctx: any) {
  const uid = getUserId(ctx);
  if (!uid) throw new Response('Unauthorized', { status: 401 });
  
  const me = await prisma.user.findUnique({ where: { id: uid } });
  if (!me || me.role !== 'ADMIN') throw new Response('Forbidden', { status: 403 });
  
  return me;
}

// GET ?q=
export const GET: APIRoute = async (ctx) => {
  await requireAdmin(ctx);
  
  const q = ctx.url.searchParams.get('q') || '';
  const list = await prisma.user.findMany({
    where: q ? { 
      OR: [
        { name: { contains: q, mode: 'insensitive' } }, 
        { phone: { contains: q } } 
      ] 
    } : {},
    orderBy: { createdAt: 'desc' }, 
    take: 100
  });
  
  return new Response(JSON.stringify(list), { 
    headers: { 'content-type': 'application/json' } 
  });
};

// POST promote/demote/delete
export const POST: APIRoute = async (ctx) => {
  await requireAdmin(ctx);
  
  const { action, userId } = await ctx.request.json();
  if (!action || !userId) return new Response('Bad Request', { status: 400 });
  
  if (action === 'promoteSeller') {
    const u = await prisma.user.update({ 
      where: { id: userId }, 
      data: { role: 'SELLER' } 
    });
    
    await prisma.seller.upsert({ 
      where: { userId }, 
      update: {}, 
      create: { userId, storeName: u.name + "'s Store" } 
    });
    
    return new Response(JSON.stringify({ ok: true }));
  }
  
  if (action === 'demoteCustomer') {
    await prisma.seller.deleteMany({ where: { userId } });
    await prisma.user.update({ 
      where: { id: userId }, 
      data: { role: 'CUSTOMER' } 
    });
    
    return new Response(JSON.stringify({ ok: true }));
  }
  
  if (action === 'deleteUser') {
    await prisma.seller.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    
    return new Response(JSON.stringify({ ok: true }));
  }
  
  return new Response('Unknown action', { status: 400 });
};
