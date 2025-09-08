export const prerender = false;
import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db';
import { parseCookies } from '../../../lib/cookies';
import { Size } from '@prisma/client';

export const POST: APIRoute = async ({ request }) => {
  const cookies = parseCookies(request);
  const cartId = Number(cookies['cartId'] || 0);
  if (!cartId) return new Response(JSON.stringify({ ok: false }), { headers:{'Content-Type':'application/json'} });

  const body = await request.json();
  const { itemId, quantity } = body as { itemId: number; quantity: number };

  if (!itemId || quantity < 1) {
    return new Response(JSON.stringify({ ok:false, error:'params' }), { status:400, headers:{'Content-Type':'application/json'} });
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return new Response(JSON.stringify({ ok:true }), { headers:{'Content-Type':'application/json'} });
};
