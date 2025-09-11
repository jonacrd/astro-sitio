import { prisma } from "./db";

export interface ProductWithCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl?: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export async function getFeaturedProducts(
  limit: number = 8,
): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    take: limit,
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProductsByCategory(
  categorySlug: string,
  limit: number = 8,
): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      category: {
        slug: categorySlug,
      },
    },
    take: limit,
    include: {
      category: true,
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
    skip,
    take: limit,
    include: {
      category: true,
    },
  });
}

export async function getTopProductsByCategory(
  categorySlug: string,
  limit: number = 3,
): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    where: {
      category: {
        slug: categorySlug,
      },
    },
    take: limit,
    include: {
      category: true,
    },
    orderBy: {
      priceCents: "desc", // Productos más caros como "destacados"
    },
  });
}

export async function getBestSellingProducts(
  limit: number = 6,
): Promise<ProductWithCategory[]> {
  // Simulamos productos más vendidos basado en stock bajo (productos que se venden más)
  return await prisma.product.findMany({
    where: {
      stock: {
        lt: 15, // Productos con stock bajo = más vendidos
      },
    },
    take: limit,
    include: {
      category: true,
    },
    orderBy: {
      stock: "asc", // Menor stock = más vendido
    },
  });
}

export async function getCategoryBannersData() {
  const categories = await prisma.category.findMany();

  const bannersData = await Promise.all(
    categories.map(async (category) => {
      const products = await getTopProductsByCategory(category.slug, 3);
      return {
        category,
        products,
      };
    }),
  );

  return bannersData.filter((banner) => banner.products.length > 0);
}
