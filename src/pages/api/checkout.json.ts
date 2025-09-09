import type { APIRoute } from 'astro';
import { prisma } from '@lib/db';
import { getOrSetSessionId } from '@lib/session';
import { randomUUID } from 'node:crypto';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { customerName, customerEmail, customerPhone, customerAddress } = await request.json();
    
    if (!customerName || !customerEmail) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionId = getOrSetSessionId(request);
    
    // Get cart with items
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

    if (!cart || cart.items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate total
    const totalCents = cart.items.reduce((sum, item) => 
      sum + (item.product.priceCents * item.qty), 0
    );

    // Generate order code
    const orderCode = `ORDER-${Date.now()}-${randomUUID().substring(0, 8)}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderCode,
        totalCents,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            qty: item.qty,
            priceCents: item.product.priceCents
          }))
        }
      }
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      orderCode: order.orderCode
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    return new Response(JSON.stringify({ error: 'Failed to process checkout' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
