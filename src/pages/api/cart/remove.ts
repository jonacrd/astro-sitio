import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db';
import { getOrSetSessionId } from '../../../lib/session';

export const POST: APIRoute = async ({ request }) => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const sessionId = getOrSetSessionId(request, headers);
  const { productId, qty } = await request.json();

  if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty <= 0) {
    return new Response(JSON.stringify({ error: 'Parámetros inválidos' }), { status: 400, headers });
  }

  const cart = await prisma.cart.findUnique({ where: { sessionId } });
  if (!cart) return new Response(JSON.stringify({ error: 'Carrito no existe' }), { status: 404, headers });

  const item = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
  if (!item) return new Response(JSON.stringify({ error: 'Producto no está en carrito' }), { status: 404, headers });

  const nextQty = item.qty - qty;
  if (nextQty > 0) {
    await prisma.cartItem.update({ where: { cartId_productId: { cartId: cart.id, productId } }, data: { qty: nextQty } });
  } else {
    await prisma.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
  }

  const full = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { product: true } } } });
  return new Response(JSON.stringify(full), { headers });
};
