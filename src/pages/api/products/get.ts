import type { APIRoute } from 'astro'
import { getProductBySlug } from '@lib/products.server'

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug as string
    
    if (!slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slug requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    const product = await getProductBySlug(slug)
    
    if (!product) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Producto no encontrado'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    return new Response(JSON.stringify({
      success: true,
      product
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener producto'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
