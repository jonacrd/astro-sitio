import type { APIRoute } from 'astro';
import { prisma } from '../../lib/db';
import { getOrSetSessionId } from '../../lib/session';

function buildOrderCode(lastId: number) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return `A-${y}${m}${d}-${String(lastId).padStart(6,'0')}`;
}

export const POST: APIRoute = async ({ request }) => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const sessionId = getOrSetSessionId(request, headers);

  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: { include: { product: true } } }
  });
  if (!cart || cart.items.length === 0) {
    return new Response(JSON.stringify({ error: 'Carrito vacío' }), { status: 400, headers });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      for (const it of cart.items) {
        const p = await tx.product.findUnique({ where: { id: it.productId } });
        if (!p || p.stock < it.qty) throw new Error(`Sin stock para ${it.product?.name ?? 'producto'}`);
      }

      for (const it of cart.items) {
        await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } });
      }

      const total = cart.items.reduce((acc, it) => acc + it.qty * (it.product?.priceCents ?? 0), 0);
      const order = await tx.order.create({ data: { orderCode: 'TEMP', totalCents: total } });

      await Promise.all(cart.items.map(it => tx.orderItem.create({
        data: { orderId: order.id, productId: it.productId, qty: it.qty, priceCents: it.product!.priceCents }
      })));

      const code = buildOrderCode(order.id);
      const finalOrder = await tx.order.update({
        where: { id: order.id },
        data: { orderCode: code },
        include: { items: { include: { product: true } } }
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return finalOrder;
    });

    return new Response(JSON.stringify({ ok: true, order: result }), { headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Error en checkout' }), { status: 409, headers });
  }
};

