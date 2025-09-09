import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { getOrSetSessionId } from '@lib/session';

export const GET: APIRoute = async ({ request }) => {
  try {
    const sessionId = getOrSetSessionId(request);
    
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart) {
      return new Response(JSON.stringify({ items: [], totalCents: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const totalCents = cart.items.reduce((sum, item) => 
      sum + (item.product.priceCents * item.qty), 0
    );

    return new Response(JSON.stringify({
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        qty: item.qty,
        product: {
          id: item.product.id,
          name: item.product.name,
          priceCents: item.product.priceCents,
          imageUrl: item.product.imageUrl
        }
      })),
      totalCents
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch cart' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
