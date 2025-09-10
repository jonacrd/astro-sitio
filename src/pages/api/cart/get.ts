import type { APIRoute } from 'astro'
import { getSessionId, getCart } from '@lib/cart.server'
import { calculateCartTotal } from '@lib/money'

export const GET: APIRoute = async (context) => {
  try {
    const sessionId = getSessionId(context)
    const cart = await getCart(sessionId)
    
    if (!cart) {
      return new Response(JSON.stringify({
        success: true,
        cart: null,
        items: [],
        totalCents: 0,
        itemCount: 0
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    const totalCents = calculateCartTotal(
      cart.items.map(item => ({
        quantity: item.quantity,
        priceCents: item.product.priceCents
      }))
    )
    
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    
    return new Response(JSON.stringify({
      success: true,
      cart,
      items: cart.items,
      totalCents,
      itemCount
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error getting cart:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener carrito'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
