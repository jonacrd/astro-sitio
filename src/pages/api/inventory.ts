import type { APIRoute } from 'astro'
import { prisma } from '@/lib/db'

export const GET: APIRoute = async () => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceCents: true,
        stock: true,
        imageUrl: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return new Response(JSON.stringify({
      success: true,
      data: products,
      total: products.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener el inventario'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

