import type { APIRoute } from 'astro'
import { listProducts, getProductsByCategory } from '@lib/products.server'

export const GET: APIRoute = async ({ url }) => {
  try {
    const category = url.searchParams.get('category')
    
    const products = category 
      ? await getProductsByCategory(category)
      : await listProducts()
    
    return new Response(JSON.stringify({
      success: true,
      products
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener productos'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
