import { prisma } from "./db";
import type { Product, Category, Seller, SellerProduct } from "@prisma/client";

export interface ProductWithCategory extends Product {
  category: Category;
  sellers: (SellerProduct & { seller: Seller })[];
}

export async function getFeaturedProducts(
  limit: number = 8,
): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      active: true,
    },
    take: limit,
    include: {
      category: true,
      sellers: {
        include: {
          seller: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProductsByCategory(
  categoryName: string,
  limit: number = 8,
): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      category: {
        name: categoryName, // En el nuevo schema no hay slug en Category
      },
      active: true,
    },
    take: limit,
    include: {
      category: true,
      sellers: {
        include: {
          seller: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getRandomProducts(
  limit: number = 8,
): Promise<ProductWithCategory[]> {
  const totalProducts = await prisma.product.count();
  const skip = Math.floor(Math.random() * Math.max(0, totalProducts - limit));

  return await prisma.product.findMany({
    where: {
      active: true,
    },
    skip,
    take: limit,
    include: {
      category: true,
      sellers: {
        include: {
          seller: true,
        },
      },
    },
  });
}

export async function getTopProductsByCategory(
  categoryName: string,
  limit: number = 3,
): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      category: {
        name: categoryName,
      },
      active: true,
    },
    take: limit,
    include: {
      category: true,
      sellers: {
        include: {
          seller: true,
        },
      },
    },
    orderBy: {
      priceCents: "desc", // Productos más caros como "destacados"
    },
  });
}

export async function getBestSellingProducts(
  limit: number = 6,
): Promise<ProductWithCategory[]> {
  // Simulamos productos más vendidos basado en stock bajo en SellerProduct
  return await prisma.product.findMany({
    where: {
      active: true,
      sellers: {
        some: {
          stock: {
            lt: 15, // Productos con stock bajo = más vendidos
          },
        },
      },
    },
    take: limit,
    include: {
      category: true,
      sellers: {
        include: {
          seller: true,
        },
      },
    },
    orderBy: {
      rating: "desc", // Productos con mejor rating como "más vendidos"
    },
  });
}

export async function getCategoryBannersData() {
  // Optimización: obtener solo las primeras 3 categorías para mejorar velocidad
  const categories = await prisma.category.findMany({
    take: 3,
    select: {
      id: true,
      name: true,
    },
  });

  const bannersData = await Promise.all(
    categories.map(async (category) => {
      const products = await prisma.product.findMany({
        where: {
          category: {
            name: category.name,
          },
          active: true,
        },
        take: 2, // Reducir a 2 productos por categoría
        select: {
          id: true,
          name: true,
          priceCents: true,
          discountCents: true,
          imageUrl: true,
          origin: true,
          rating: true,
        },
        orderBy: {
          priceCents: "desc",
        },
      });
      
      return {
        category,
        products,
      };
    }),
  );

  return bannersData.filter((banner) => banner.products.length > 0);
}
