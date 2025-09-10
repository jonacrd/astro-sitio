import type { APIRoute } from 'astro'
import { getSessionId, updateCartItem } from '@lib/cart.server'
import { calculateCartTotal } from '@lib/money'

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json()
    const { productId, quantity } = body
    
    if (!productId || typeof productId !== 'number') {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de producto requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    if (quantity < 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cantidad no puede ser negativa'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    const sessionId = getSessionId(context)
    const cart = await updateCartItem(sessionId, productId, quantity)
    
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
      totalCents,
      itemCount,
      message: quantity === 0 ? 'Producto removido del carrito' : 'Cantidad actualizada'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error updating cart item:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar carrito'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

