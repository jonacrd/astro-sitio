// src/pages/api/cart.json.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/db';
import { parseCookies, buildSetCookie } from '../../lib/cookies';

// Tipo de carrito con items+variant+product
type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { variant: { include: { product: true } } } } }
}>;

export const GET: APIRoute = async ({ request }) => {
  const cookies = parseCookies(request);
  let cartId = cookies['cartId'] ? Number(cookies['cartId']) : undefined;

  let cart: CartWithItems | null = cartId
    ? await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: { include: { variant: { include: { product: true } } } },
        },
      })
    : null;

  // si no hay cookie o el carrito no existe => crea uno nuevo
  let setCookieHeader: string | undefined;
  if (!cart) {
    const created = await prisma.cart.create({ data: {} });
    cartId = created.id;
    setCookieHeader = buildSetCookie('cartId', String(cartId), {
      maxAgeSec: 60 * 60 * 24 * 30,
    });

    // 🔁 re-lee con include para que el tipo tenga 'items'
    cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  // Por seguridad: si por alguna razón sigue null, responde shape vacío compatible
  if (!cart) {
    const empty: CartWithItems = {
      id: cartId ?? 0,
      customerId: null,
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
