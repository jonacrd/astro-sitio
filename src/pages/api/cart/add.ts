import type { APIRoute } from 'astro'
import { addToCart, getSessionId } from '@lib/cart.server'

export const POST: APIRoute = async (context) => {
  try {
    const { productId, quantity = 1 } = await context.request.json()
    const sessionId = getSessionId(context)

    // Usar la función existente de cart.server
    const cartData = await addToCart(sessionId, Number(productId), Number(quantity))
    
    const totalCents = cartData.items.reduce((total: number, item) => 
      total + (item.quantity * item.product.priceCents), 0
    )
    const itemCount = cartData.items.reduce((total: number, item) => total + item.quantity, 0)

    return new Response(JSON.stringify({
      success: true,
      items: cartData.items,
      totalCents,
      itemCount
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error al agregar al carrito'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
