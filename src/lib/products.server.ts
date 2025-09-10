import { prisma } from './db'
import type { Product, Category } from '@prisma/client'

export type ProductWithCategory = Product & {
  category: Category
}

/**
 * Obtener todos los productos con sus categorías
 */
export async function listProducts(): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    include: {
      category: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

/**
 * Obtener productos por categoría
 */
export async function getProductsByCategory(categorySlug: string): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      category: {
        slug: categorySlug
      }
    },
    include: {
      category: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

/**
 * Obtener producto por slug
 */
export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  return await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true
    }
  })
}

/**
 * Obtener producto por ID
 */
export async function getProductById(id: number): Promise<Product | null> {
  return await prisma.product.findUnique({
    where: { id }
  })
}

/**
 * Obtener todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  return await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })
}

/**
 * Buscar productos por término
 */
export async function searchProducts(query: string): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    },
    include: {
      category: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}
