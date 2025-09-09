import type { APIRoute } from 'astro';
import { prisma } from '../../lib/db'; // ajusta la ruta si difiere
import { randomUUID } from 'crypto';

export const GET: APIRoute = async ({ cookies }) => {
  const headers = new Headers({ 'Content-Type': 'application/json' });

  // asegurar sessionId en cookie
  let sessionId = cookies.get('sessionId')?.value;
  if (!sessionId) {
    sessionId = randomUUID();
    cookies.set('sessionId', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60, // ~60 días en segundos
    });
  }

  // upsert SIEMPRE con create { sessionId }
  const cart = await prisma.cart.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
    include: { items: { include: { product: true } } },
  });

  return new Response(JSON.stringify(cart), { headers });
};


