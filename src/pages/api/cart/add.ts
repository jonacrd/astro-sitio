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

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return new Response(JSON.stringify({ error: 'Producto no existe' }), { status: 404, headers });

  const cart = await prisma.cart.upsert({ where: { sessionId }, update: {}, create: { sessionId } });

  const currentItem = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
  const currentQty = currentItem?.qty ?? 0;
  const nextQty = currentQty + qty;

  if (nextQty > product.stock) {
    return new Response(JSON.stringify({ error: 'No hay suficiente stock', available: product.stock - currentQty }), { status: 409, headers });
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { qty: nextQty },
    create: { cartId: cart.id, productId, qty }
  });

  const full = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { product: true } } } });
  return new Response(JSON.stringify(full), { headers });
};
