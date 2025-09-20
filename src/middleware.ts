import type { MiddlewareHandler } from 'astro';
import { getUserId } from '@lib/session';

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const path = ctx.url.pathname;
  
  if (path === '/dashboard') {
    // Para el sistema mock, permitir acceso sin autenticación
    // En producción, aquí se validaría la autenticación
    const mockUser = { id: 'mock-user', role: 'SELLER', name: 'Vendedor Demo' };
    ctx.locals.user = mockUser;
  }
  
  return next();
};
