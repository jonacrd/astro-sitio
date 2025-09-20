import { prisma } from "./db";
import type { Product, Category, Seller, SellerProduct } from "@prisma/client";

export type ProductWithCategory = Product & {
  category: Category;
  sellers: (SellerProduct & { seller: Seller })[];
};

/**
 * Obtener todos los productos con sus categorías
 */
export async function listProducts(): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceCents: true,
      discountCents: true,
      imageUrl: true,
      origin: true,
      active: true,
      rating: true,
      categoryId: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      sellers: {
        select: {
          stock: true,
          seller: {
            select: {
              id: true,
              name: true,
              online: true,
              deliveryEnabled: true,
              deliveryETA: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Obtener productos por categoría
 */
export async function getProductsByCategory(
  categorySlug: string,
): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      category: {
        name: categorySlug, // En el nuevo schema no hay slug en Category
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceCents: true,
      discountCents: true,
      imageUrl: true,
      origin: true,
      active: true,
      rating: true,
      categoryId: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      sellers: {
        select: {
          stock: true,
          seller: {
            select: {
              id: true,
              name: true,
              online: true,
              deliveryEnabled: true,
              deliveryETA: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Obtener producto por slug
 */
export async function getProductBySlug(
  slug: string,
): Promise<ProductWithCategory | null> {
  return await prisma.product.findUnique({
    where: { slug },
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

/**
 * Obtener producto por ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  return await prisma.product.findUnique({
    where: { id },
  });
}

/**
 * Obtener todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  return await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(limit: number = 4): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceCents: true,
      discountCents: true,
      imageUrl: true,
      origin: true,
      active: true,
      rating: true,
      categoryId: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      sellers: {
        select: {
          stock: true,
          seller: {
            select: {
              id: true,
              name: true,
              online: true,
              deliveryEnabled: true,
              deliveryETA: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Buscar productos por término
 */
export async function searchProducts(
  query: string,
): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
      ],
    },
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
