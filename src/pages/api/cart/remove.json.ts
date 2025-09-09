import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { getOrSetSessionId } from '@lib/session';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productId } = await request.json();
    
    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
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

    // Remove item from cart
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId: parseInt(productId)
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return new Response(JSON.stringify({ error: 'Failed to remove from cart' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
