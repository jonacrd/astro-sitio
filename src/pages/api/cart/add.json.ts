import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { getOrSetSessionId } from '@lib/session';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productId, qty = 1 } = await request.json();
    
    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionId = getOrSetSessionId(request);
    
    // Get or create cart
    const cart = await prisma.cart.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {}
    });

    // Add or update item in cart
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: parseInt(productId)
        }
      },
      create: {
        cartId: cart.id,
        productId: parseInt(productId),
        qty: parseInt(qty)
      },
      update: {
        qty: {
          increment: parseInt(qty)
        }
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return new Response(JSON.stringify({ error: 'Failed to add to cart' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
