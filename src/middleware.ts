import type { MiddlewareHandler } from 'astro';
import { prisma } from '@lib/db';
import { getUserId } from '@lib/session';

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const path = ctx.url.pathname;
  
  if (path.startsWith('/dashboard')) {
    const uid = getUserId(ctx);
    if (!uid) return ctx.redirect('/login');
    
    const u = await prisma.user.findUnique({ where: { id: uid } });
    if (!u || (u.role !== 'ADMIN' && u.role !== 'SELLER')) {
      return ctx.redirect('/');
    }
    
    ctx.locals.user = u;
  }
  
  return next();
};
