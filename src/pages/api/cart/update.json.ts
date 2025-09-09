import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { getOrSetSessionId } from '@lib/session';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productId, qty } = await request.json();
    
    if (!productId || qty === undefined) {
      return new Response(JSON.stringify({ error: 'Product ID and quantity are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionId = getOrSetSessionId(request);
    
    const cart = await prisma.cart.findUnique({
      where: { sessionId }
    });

    if (!cart) {
      return new Response(JSON.stringify({ error: 'Cart not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const quantity = parseInt(qty);
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: parseInt(productId)
        }
      });
    } else {
      // Update quantity
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
          qty: quantity
        },
        update: {
          qty: quantity
        }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return new Response(JSON.stringify({ error: 'Failed to update cart' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
