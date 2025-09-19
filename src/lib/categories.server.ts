import { prisma } from "./db";

export interface CategorySection {
  id: string;
  name: string;
  products: Array<{
    id: number;
    name: string;
    priceCents: number;
    stock: number;
    imageUrl?: string;
  }>;
  color: string;
  gradient: string;
  icon: string;
}

/**
 * Obtener productos por categorías usando filtros en el nombre o descripción
 */
export async function getCategorySections(): Promise<CategorySection[]> {
  try {
    // Obtener productos por categorías usando filtros en el nombre o descripción
    const categoryData = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: "hombre" } },
            { description: { contains: "hombre" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          stock: true,
          imageUrl: true,
        },
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: "mujer" } },
            { description: { contains: "mujer" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          stock: true,
          imageUrl: true,
        },
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: "niño" } },
            { description: { contains: "niño" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          stock: true,
          imageUrl: true,
        },
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: "zapato" } },
            { description: { contains: "zapato" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          stock: true,
          imageUrl: true,
        },
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: "accesorio" } },
            { description: { contains: "accesorio" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          priceCents: true,
          stock: true,
          imageUrl: true,
        },
      }),
    ]);

    const sections: CategorySection[] = [
      {
        id: "hombre",
        name: "HOMBRE",
        products: categoryData[0],
        color: "#2c3e50",
        gradient: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
        icon: "👔",
      },
      {
        id: "mujer",
        name: "MUJER",
        products: categoryData[1],
        color: "#e74c3c",
        gradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
        icon: "👗",
      },
      {
        id: "ninos",
        name: "NIÑOS",
        products: categoryData[2],
        color: "#f39c12",
        gradient: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
        icon: "🧸",
      },
      {
        id: "zapatos",
        name: "ZAPATOS",
        products: categoryData[3],
        color: "#8e44ad",
        gradient: "linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)",
        icon: "👟",
      },
      {
        id: "accesorios",
        name: "ACCESORIOS",
        products: categoryData[4],
        color: "#27ae60",
        gradient: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
        icon: "💍",
      },
    ];

    return sections;
  } catch (error) {
    console.error("Error getting category sections:", error);
    return [];
  }
}




