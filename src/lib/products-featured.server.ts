import { productRepo, categoryRepo } from "./repos";
import type { Product, Category } from "./repos";

export interface ProductWithCategory extends Product {
  category?: Category;
}

export async function getFeaturedProducts(
  limit: number = 8,
): Promise<ProductWithCategory[]> {
  const products = await productRepo.findMany({
    active: true
  });
  
  return products.slice(0, limit).map(p => ({
    ...p,
    category: p.category
  }));
}

export async function getProductsByCategory(
  categoryName: string,
  limit: number = 8,
): Promise<ProductWithCategory[]> {
  const category = await categoryRepo.findByName(categoryName);
  if (!category) return [];
  
  const products = await productRepo.findMany({
    categoryId: category.id,
    active: true
  });
  
  return products.slice(0, limit).map(p => ({
    ...p,
    category: p.category
  }));
}

export async function getRandomProducts(
  limit: number = 8,
): Promise<ProductWithCategory[]> {
  const products = await productRepo.findMany({
    active: true
  });
  
  // Mezclar array y tomar los primeros 'limit' elementos
  const shuffled = products.sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, limit).map(p => ({
    ...p,
    category: p.category
  }));
}

export async function getTopProductsByCategory(
  categoryName: string,
  limit: number = 3,
): Promise<ProductWithCategory[]> {
  const category = await categoryRepo.findByName(categoryName);
  if (!category) return [];
  
  const products = await productRepo.findMany({
    categoryId: category.id,
    active: true
  });
  
  // Ordenar por precio descendente y tomar los primeros
  const sorted = products.sort((a, b) => b.priceCents - a.priceCents);
  
  return sorted.slice(0, limit).map(p => ({
    ...p,
    category: p.category
  }));
}

export async function getBestSellingProducts(
  limit: number = 6,
): Promise<ProductWithCategory[]> {
  // Simulamos productos más vendidos basado en rating alto
  const products = await productRepo.findMany({
    active: true
  });
  
  // Ordenar por rating descendente y tomar los primeros
  const sorted = products.sort((a, b) => b.rating - a.rating);
  
  return sorted.slice(0, limit).map(p => ({
    ...p,
    category: p.category
  }));
}

export async function getCategoryBannersData() {
  // Optimización: obtener solo las primeras 3 categorías para mejorar velocidad
  const categories = await categoryRepo.findMany();
  const topCategories = categories.slice(0, 3);

  const bannersData = await Promise.all(
    topCategories.map(async (category) => {
      const products = await productRepo.findMany({
        categoryId: category.id,
        active: true
      });
      
      // Ordenar por precio descendente y tomar los primeros 2
      const sorted = products.sort((a, b) => b.priceCents - a.priceCents);
      const topProducts = sorted.slice(0, 2);
      
      return {
        category,
        products: topProducts,
      };
    }),
  );

  return bannersData.filter((banner) => banner.products.length > 0);
}
