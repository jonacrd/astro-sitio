import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Por ahora, devolver datos mock hasta que arreglemos Supabase
    const mockProducts = [
      {
        id: '1',
        title: 'Hamburguesa Clásica',
        category: 'comida',
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        description: 'Hamburguesa con carne, lechuga, tomate y queso',
        price_cents: 1500,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Pizza Margherita',
        category: 'comida',
        image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
        description: 'Pizza con tomate, mozzarella y albahaca',
        price_cents: 2000,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Empanadas de Carne',
        category: 'comida',
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        description: 'Empanadas tradicionales rellenas de carne',
        price_cents: 800,
        created_at: new Date().toISOString()
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: mockProducts,
      count: mockProducts.length
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
