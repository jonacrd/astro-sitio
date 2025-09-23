import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const path = ctx.url.pathname;
  
  // Middleware simplificado - la autenticación se maneja en los componentes React
  // Los componentes SellerGuard y otros manejan la autenticación del lado del cliente
  
  return next();
};
