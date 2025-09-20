import { prisma } from "./db";

export interface CategorySection {
  id: string;
  name: string;
  products: Array<{
    id: string;
    name: string;
    priceCents: number;
    discountCents: number;
    imageUrl?: string;
    origin?: string;
    rating: number;
  }>;
  color: string;
  gradient: string;
  icon: string;
}

/**
 * Obtener productos por categorías usando las categorías reales del nuevo schema
 */
export async function getCategorySections(): Promise<CategorySection[]> {
  try {
    // Obtener productos por categorías reales del nuevo schema
    const categoryData = await Promise.all([
      prisma.product.findMany({
        where: {
          category: {
            name: "ropa",
          },
          active: true,
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          discountCents: true,
          imageUrl: true,
          origin: true,
          rating: true,
        },
      }),
      prisma.product.findMany({
        where: {
          category: {
            name: "comida",
          },
          active: true,
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          discountCents: true,
          imageUrl: true,
          origin: true,
          rating: true,
        },
      }),
      prisma.product.findMany({
        where: {
          category: {
            name: "tecnologia",
          },
          active: true,
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          discountCents: true,
          imageUrl: true,
          origin: true,
          rating: true,
        },
      }),
      prisma.product.findMany({
        where: {
          category: {
            name: "hogar",
          },
          active: true,
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          discountCents: true,
          imageUrl: true,
          origin: true,
          rating: true,
        },
      }),
      prisma.product.findMany({
        where: {
          category: {
            name: "deportes",
          },
          active: true,
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          discountCents: true,
          imageUrl: true,
          origin: true,
          rating: true,
        },
      }),
    ]);

    const sections: CategorySection[] = [
      {
        id: "ropa",
        name: "ROPA",
        products: categoryData[0],
        color: "#2c3e50",
        gradient: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
        icon: "👕",
      },
      {
        id: "comida",
        name: "COMIDA",
        products: categoryData[1],
        color: "#e74c3c",
        gradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
        icon: "🍕",
      },
      {
        id: "tecnologia",
        name: "TECNOLOGÍA",
        products: categoryData[2],
        color: "#f39c12",
        gradient: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
        icon: "💻",
      },
      {
        id: "hogar",
        name: "HOGAR",
        products: categoryData[3],
        color: "#8e44ad",
        gradient: "linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)",
        icon: "🏠",
      },
      {
        id: "deportes",
        name: "DEPORTES",
        products: categoryData[4],
        color: "#27ae60",
        gradient: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
        icon: "⚽",
      },
    ];

    return sections;
  } catch (error) {
    console.error("Error getting category sections:", error);
    return [];
  }
}




