// src/pages/api/cart.json.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/db';
import { parseCookies, buildSetCookie } from '../../lib/cookies';
import { randomUUID } from 'crypto';

// Tipo de carrito con items+product
type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } }
}>;

export const GET: APIRoute = async ({ request }) => {
  const cookies = parseCookies(request);
  let sessionId = cookies['sessionId'];

  // Si no hay sessionId, crear uno nuevo
  if (!sessionId) {
    sessionId = randomUUID();
  }

  let cart: CartWithItems | null = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: { include: { product: true } },
    },
  });

  // si no hay carrito => crea uno nuevo
  let setCookieHeader: string | undefined;
  if (!cart) {
    cart = await prisma.cart.create({ 
      data: { sessionId },
      include: {
        items: { include: { product: true } },
      },
    });
    setCookieHeader = buildSetCookie('sessionId', sessionId, {
      maxAgeSec: 60 * 60 * 24 * 30,
    });
  }

  // Por seguridad: si por alguna razón sigue null, responde shape vacío compatible
  if (!cart) {
    const empty: CartWithItems = {
      id: 0,
      sessionId: sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    } as CartWithItems;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (setCookieHeader) headers['Set-Cookie'] = setCookieHeader;
    return new Response(JSON.stringify(empty), { headers });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (setCookieHeader) headers['Set-Cookie'] = setCookieHeader;
  return new Response(JSON.stringify(cart), { headers });
};
