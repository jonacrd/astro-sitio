export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db';
import { parseCookies } from '../../../lib/cookies';

function makeCookie(name: string, value: string, maxAgeSec = 60 * 60 * 24 * 30) {
  // En prod agrega `Secure;` si sirves por HTTPS
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export const POST: APIRoute = async ({ request }) => {
  const cookies = parseCookies(request);
  const cartId = Number(cookies['cartId'] || 0);

  console.log('[CHECKOUT] Iniciando checkout con cartId:', cartId);

  if (!cartId) {
    console.log('[CHECKOUT] Error: No hay carrito activo');
    return new Response(JSON.stringify({ ok: false, error: 'No hay carrito activo' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) Traer carrito con items y variante+producto
      const cart = await tx.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      console.log('[CHECKOUT] Carrito encontrado:', { 
        id: cart?.id, 
        itemsCount: cart?.items?.length || 0,
        items: cart?.items?.map(i => ({ id: i.id, variantId: i.variantId, quantity: i.quantity }))
      });

      if (!cart || cart.items.length === 0) {
        console.log('[CHECKOUT] Error: Carrito vacío');
        throw new Error('Carrito vacío');
      }

      // 2) Calcular subtotal y descontar stock
      let subtotalCents = 0;

      for (const it of cart.items) {
        const price = (it.salePriceCents ?? it.variant?.salePriceCents ?? 0) | 0;
        const qty = it.quantity | 0;
        subtotalCents += price * qty;

        // Descuenta stock sólo si hay suficiente
        const updated = await tx.inventory.updateMany({
          where: { variantId: it.variantId, stock: { gte: qty } },
          data: { stock: { decrement: qty } }
        });

        if (updated.count === 0) {
          const name = it.variant?.product?.name ?? `Var ${it.variantId}`;
          throw new Error(`Sin stock suficiente para: ${name}`);
        }
      }

      // 3) Total = subtotal (aquí luego sumas envío/impuestos)
      const totalCents = subtotalCents;

      // 4) Crear orden con items
      console.log('[CHECKOUT] Creando orden con subtotal:', subtotalCents, 'total:', totalCents);
      
      const order = await tx.order.create({
        data: {
          customerId: cart.customerId ?? null,
          status: 'PENDING',
          subtotalCents,
          totalCents,
          items: {
            create: cart.items.map((it) => {
              const orderItem = {
                productId: it.variant!.productId,
                variantId: it.variantId,
                quantity: it.quantity,
                salePriceCents: (it.salePriceCents ?? it.variant!.salePriceCents ?? 0) | 0,
                size: it.size,
                colorName: it.colorName ?? it.variant!.colorName ?? '',
                colorHex: it.colorHex ?? it.variant!.colorHex ?? '#000000'
              };
              console.log('[CHECKOUT] Creando OrderItem:', orderItem);
              return orderItem;
            })
          }
        },
        include: { items: true }
      });

      console.log('[CHECKOUT] Orden creada exitosamente:', order.id);

      // 5) Vaciar el carrito actual
      await tx.cartItem.deleteMany({ where: { cartId } });

      // 6) Crear nuevo carrito (rotamos sesión)
      const newCart = await tx.cart.create({ data: {} });

      return { order, newCart };
    });

    // 7) Setear cookie con el nuevo cartId
    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', makeCookie('cartId', String(result.newCart.id)));

    console.log('[CHECKOUT] Checkout completado exitosamente, orderId:', result.order.id);
    return new Response(JSON.stringify({ ok: true, orderId: result.order.id }), { headers });
  } catch (e: any) {
    console.error('[CHECKOUT] Error completo:', e);
    console.error('[CHECKOUT] Stack trace:', e?.stack);
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Error en checkout' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
};

