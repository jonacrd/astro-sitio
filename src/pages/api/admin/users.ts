import type { APIRoute } from 'astro';
import { userRepo } from '@lib/repos';
import { getUserId } from '@lib/session';

async function requireAdmin(ctx: any) {
  const uid = getUserId(ctx);
  if (!uid) throw new Response('Unauthorized', { status: 401 });
  
  const me = await userRepo.findById(uid);
  if (!me || me.role !== 'ADMIN') throw new Response('Forbidden', { status: 403 });
  
  return me;
}

// GET ?q=
export const GET: APIRoute = async (ctx) => {
  await requireAdmin(ctx);
  
  // TODO: Implementar búsqueda de usuarios en modo mock
  const list = [];
  
  return new Response(JSON.stringify(list), { 
    headers: { 'content-type': 'application/json' } 
  });
};

// POST promote/demote/delete
export const POST: APIRoute = async (ctx) => {
  await requireAdmin(ctx);
  
  const { action, userId } = await ctx.request.json();
  if (!action || !userId) return new Response('Bad Request', { status: 400 });
  
  // TODO: Implementar acciones de administración en modo mock
  return new Response(JSON.stringify({ ok: true, message: 'Acción no implementada en modo mock' }));
};
