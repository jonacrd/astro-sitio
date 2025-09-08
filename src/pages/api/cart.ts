import type { APIRoute } from 'astro';
import { prisma } from '../../lib/db';
import { getOrSetSessionId } from '../../lib/session';

export const GET: APIRoute = async ({ request }) => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const sessionId = getOrSetSessionId(request, headers);

  const cart = await prisma.cart.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
    include: { items: { include: { product: true } } }
  });

  return new Response(JSON.stringify(cart), { headers });
};
