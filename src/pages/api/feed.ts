import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const pageSize = Math.min(Number(url.searchParams.get('pageSize')||10), 20);
    const offset = Number(url.searchParams.get('cursor')||0);

    // Datos mock expandidos con información de vendedores
    const mockItems = [
      // Bloque 1
      { type: 'product', sellerId: 's1', sellerProductId: 'sp1', title: 'Perro Caliente', priceCents: 2000, imageUrl: null, category: 'comida', sellerActive: true, stock: 15, delivery: '30 min' },
      { type: 'product', sellerId: 's2', sellerProductId: 'sp2', title: 'Hamburguesa', priceCents: 3500, imageUrl: null, category: 'comida', sellerActive: true, stock: 8, delivery: '25 min' },
      { type: 'product', sellerId: 's3', sellerProductId: 'sp3', title: 'Salchipapa', priceCents: 2800, imageUrl: null, category: 'comida', sellerActive: true, stock: 12, delivery: '20 min' },
      { type: 'product', sellerId: 's4', sellerProductId: 'sp4', title: 'Papa Rellena', priceCents: 2200, imageUrl: null, category: 'comida', sellerActive: false, stock: 0, delivery: 'No disponible' },
      { type: 'product', sellerId: 's5', sellerProductId: 'sp5', title: 'Empanada Venezolana', priceCents: 1800, imageUrl: null, category: 'comida', sellerActive: true, stock: 20, delivery: '15 min' },
      
      // Bloque 2
      { type: 'product', sellerId: 's6', sellerProductId: 'sp6', title: 'Cerveza', priceCents: 1800, imageUrl: null, category: 'cervezas', sellerActive: true, stock: 25, delivery: '20 min' },
      { type: 'product', sellerId: 's7', sellerProductId: 'sp7', title: 'Ron', priceCents: 12000, imageUrl: null, category: 'ron', sellerActive: true, stock: 5, delivery: '30 min' },
      { type: 'product', sellerId: 's8', sellerProductId: 'sp8', title: 'Whisky', priceCents: 25000, imageUrl: null, category: 'whisky', sellerActive: false, stock: 0, delivery: 'No disponible' },
      { type: 'product', sellerId: 's9', sellerProductId: 'sp9', title: 'Vodka', priceCents: 15000, imageUrl: null, category: 'vodka', sellerActive: true, stock: 3, delivery: '35 min' },
      { type: 'product', sellerId: 's10', sellerProductId: 'sp10', title: 'Aguardiente', priceCents: 8000, imageUrl: null, category: 'aguardiente', sellerActive: true, stock: 10, delivery: '25 min' },
      
      // Bloque 3
      { type: 'product', sellerId: 's11', sellerProductId: 'sp11', title: 'Corte de Cabello', priceCents: 8000, imageUrl: null, category: 'peluqueria', sellerActive: true, stock: 5, delivery: '45 min' },
      { type: 'product', sellerId: 's12', sellerProductId: 'sp12', title: 'Manicure', priceCents: 5000, imageUrl: null, category: 'manicurista', sellerActive: true, stock: 8, delivery: '40 min' },
      { type: 'product', sellerId: 's13', sellerProductId: 'sp13', title: 'Reparación Moto', priceCents: 15000, imageUrl: null, category: 'mecanica', sellerActive: false, stock: 0, delivery: 'No disponible' },
      { type: 'product', sellerId: 's14', sellerProductId: 'sp14', title: 'Alarma Auto', priceCents: 80000, imageUrl: null, category: 'alarmas', sellerActive: true, stock: 2, delivery: '60 min' },
      { type: 'product', sellerId: 's15', sellerProductId: 'sp15', title: 'GPS Vehicular', priceCents: 45000, imageUrl: null, category: 'gps', sellerActive: true, stock: 4, delivery: '50 min' },
      
      // Bloque 4
      { type: 'product', sellerId: 's16', sellerProductId: 'sp16', title: 'Arepa de Huevo', priceCents: 2000, imageUrl: null, category: 'comida', sellerActive: true, stock: 18, delivery: '20 min' },
      { type: 'product', sellerId: 's17', sellerProductId: 'sp17', title: 'Cachapa', priceCents: 2500, imageUrl: null, category: 'comida', sellerActive: true, stock: 14, delivery: '25 min' },
      { type: 'product', sellerId: 's18', sellerProductId: 'sp18', title: 'Parrilla Mixta', priceCents: 4500, imageUrl: null, category: 'comida', sellerActive: true, stock: 6, delivery: '40 min' },
      { type: 'product', sellerId: 's19', sellerProductId: 'sp19', title: 'Sopa de Pollo', priceCents: 2200, imageUrl: null, category: 'comida', sellerActive: false, stock: 0, delivery: 'No disponible' },
      { type: 'product', sellerId: 's20', sellerProductId: 'sp20', title: 'Lasagna', priceCents: 4200, imageUrl: null, category: 'comida', sellerActive: true, stock: 7, delivery: '35 min' },
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
