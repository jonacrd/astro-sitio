import { productRepo, categoryRepo } from './repos'
import type { Product, Category } from './repos'

export type ProductWithCategory = Product & {
  category?: Category
}

/**
 * Obtener todos los productos con sus categorías
 */
export async function listProducts(): Promise<ProductWithCategory[]> {
  const products = await productRepo.findMany()
  return products.map(p => ({
    ...p,
    category: p.category
  }))
}

/**
 * Obtener productos por categoría
 */
export async function getProductsByCategory(categorySlug: string): Promise<ProductWithCategory[]> {
  const category = await categoryRepo.findByName(categorySlug)
  if (!category) return []
  
  const products = await productRepo.findMany({
    categoryId: category.id
  })
  
  return products.map(p => ({
    ...p,
    category: p.category
  }))
}

/**
 * Obtener producto por slug
 */
export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  const product = await productRepo.findBySlug(slug)
  if (!product) return null
  
  return {
    ...product,
    category: product.category
  }
}

/**
 * Obtener producto por ID
 */
export async function getProductById(id: number): Promise<Product | null> {
  return await productRepo.findById(id.toString())
}

/**
 * Obtener todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  return await categoryRepo.findMany()
}

/**
 * Buscar productos por término
 */
export async function searchProducts(query: string): Promise<ProductWithCategory[]> {
  const products = await productRepo.search(query)
  return products.map(p => ({
    ...p,
    category: p.category
  }))
}

