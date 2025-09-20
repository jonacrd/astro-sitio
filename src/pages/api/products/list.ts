import type { APIRoute } from "astro";
import { prisma } from "@lib/db";

export const GET: APIRoute = async ({ url }) => {
  try {
    const category = url.searchParams.get("category");
    const origin = url.searchParams.get("origin"); // 'chi' | 'ven'
    const online = url.searchParams.get("online"); // 'true' | 'false'
    const q = url.searchParams.get("q"); // búsqueda
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Construir filtros
    const where: any = {
      active: true,
    };

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (origin) {
      where.origin = origin;
    }

    if (q) {
      where.OR = [
        {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Obtener productos con vendedores
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        sellers: {
          include: {
            seller: true,
          },
        },
      },
      take: limit,
      orderBy: getOrderBy(q),
    });

    // Filtrar por vendedores online si se solicita
    let filteredProducts = products as ProductWithDetails[];
    
    if (online === 'true') {
      filteredProducts = products.filter(product => 
        product.sellers.some(sp => sp.seller.online)
      );
    }

    // Convertir al formato de UI
    const uiProducts = mapProductsToUI(filteredProducts);

    return new Response(
      JSON.stringify({
        success: true,
        products: uiProducts,
        total: uiProducts.length,
        filters: {
          category,
          origin,
          online,
          q,
          limit,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al obtener productos",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

/**
 * Determina el ordenamiento basado en la búsqueda
 */
function getOrderBy(q: string | null) {
  if (!q) {
    return { createdAt: "desc" as const };
  }

  const query = q.toLowerCase();
  
  // Si busca "barato", "oferta", "descuento", ordenar por precio efectivo
  if (query.includes('barato') || query.includes('oferta') || query.includes('descuento')) {
    return [
      { discountCents: "desc" as const },
      { priceCents: "asc" as const },
    ];
  }

  // Por defecto: rating alto y descuentos primero
  return [
    { rating: "desc" as const },
    { discountCents: "desc" as const },
    { createdAt: "desc" as const },
  ];
}
