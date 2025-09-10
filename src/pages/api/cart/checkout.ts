import type { APIRoute } from 'astro'
import { getSessionId, checkout } from '@lib/cart.server'

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json()
    const { customerName, customerEmail } = body
    
    if (!customerName || !customerEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nombre y email son requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    const sessionId = getSessionId(context)
    const result = await checkout(sessionId, customerName, customerEmail)
    
    return new Response(JSON.stringify({
      success: true,
      orderCode: result.orderCode,
      totalCents: result.totalCents,
      message: 'Orden creada exitosamente'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error during checkout:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar la orden'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

