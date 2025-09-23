import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: true,
    message: 'Endpoint de prueba funcionando',
    data: [
      { id: '1', title: 'Producto 1', category: 'comida', price_cents: 1000 },
      { id: '2', title: 'Producto 2', category: 'bebidas', price_cents: 500 }
    ]
  }), { 
    headers: { 'content-type': 'application/json' }
  });
};
