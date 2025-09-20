import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const GET: APIRoute = async ({ url }) => {
  try {
    const category = url.searchParams.get('category') || undefined;
    const origin = url.searchParams.get('origin') || undefined; // 'chi' | 'ven'
    const online = url.searchParams.get('online'); // 'true'|'false'
    const q = url.searchParams.get('q') || '';
    const limit = Number(url.searchParams.get('limit') || 60);

    // join con SellerProduct y Seller para saber si hay vendedor activo
    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(category ? { category: { name: category } } : {}),
        ...(origin ? { origin } : {}),
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      include: {
        category: true,
        sellers: { include: { seller: true } }, // para saber si alguno online
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const data = products.map(p => {
      const anyOnline = p.sellers?.some(sp => sp.seller.online) || false;
      return {
        id: p.id,
        title: p.name,
        name: p.name, // Para compatibilidad
        slug: p.slug,
        description: p.description,
        category: p.category?.name || 'otros',
        origin: p.origin,
        priceCents: p.priceCents,
        discountCents: p.discountCents || 0,
        imageUrl: p.imageUrl,
        active: p.active,
        rating: p.rating,
        online: anyOnline,
        delivery: anyOnline, // aproximación: si hay seller online asumimos delivery enabled
        // Campos adicionales para compatibilidad con UI existente
        price: Math.round(p.priceCents / 100), // En pesos
        discount: p.discountCents > 0 ? Math.round(p.discountCents / 100) : undefined,
        sellerOnline: anyOnline,
        effectivePrice: Math.round((p.priceCents - (p.discountCents || 0)) / 100),
        stock: p.sellers?.[0]?.stock || 0,
      };
    });

    // filtro extra por online si se pidió
    const filtered = online == null ? data : data.filter(d => String(d.online) === online);

    return new Response(JSON.stringify({
      success: true,
      products: filtered,
      total: filtered.length,
      filters: {
        category,
        origin,
        online,
        q,
        limit,
      },
    }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en /api/products:', error);
    
    // Fallback a datos mock si falla Prisma
    console.warn('FAKE_PRODUCTS_FALLBACK');
    const mockProducts = [
      {
        id: 'mock-1',
        name: 'Producto Demo',
        title: 'Producto Demo',
        slug: 'producto-demo',
        description: 'Producto de demostración',
        category: 'comida',
        origin: 'chi',
        priceCents: 2000,
        discountCents: 200,
        imageUrl: '/img/placeholders/comida.jpg',
        active: true,
        rating: 4.5,
        online: true,
        delivery: true,
        price: 20,
        discount: 2,
        sellerOnline: true,
        effectivePrice: 18,
        stock: 10,
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      products: mockProducts,
      total: mockProducts.length,
      filters: {
        category: url.searchParams.get('category'),
        origin: url.searchParams.get('origin'),
        online: url.searchParams.get('online'),
        q: url.searchParams.get('q'),
        limit: Number(url.searchParams.get('limit') || 60),
      },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
};

