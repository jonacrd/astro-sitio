import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const pageSize = Math.min(Number(url.searchParams.get('pageSize')||10), 20);
    const offset = Number(url.searchParams.get('cursor')||0);

    // Datos mock simples para testing
    const mockItems = [
      { type: 'product', sellerId: 's1', sellerProductId: 'sp1', title: 'Perro Caliente', priceCents: 2000, imageUrl: null, category: 'comida' },
      { type: 'product', sellerId: 's2', sellerProductId: 'sp2', title: 'Hamburguesa', priceCents: 3500, imageUrl: null, category: 'comida' },
      { type: 'banner', title: '🍽️ Comida & Postres', subtitle: 'Los mejores sabores', imageUrl: null, href: '/categoria/comida' },
      { type: 'product', sellerId: 's3', sellerProductId: 'sp3', title: 'Cerveza', priceCents: 1800, imageUrl: null, category: 'cervezas' },
      { type: 'product', sellerId: 's4', sellerProductId: 'sp4', title: 'Corte de Cabello', priceCents: 8000, imageUrl: null, category: 'peluqueria' },
    ];

    const slice = mockItems.slice(offset, offset + pageSize);
    const nextCursor = offset + pageSize < mockItems.length ? (offset + pageSize).toString() : null;

    return new Response(JSON.stringify({ items: slice, nextCursor }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error in feed API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', items: [], nextCursor: null }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    });
  }
};
