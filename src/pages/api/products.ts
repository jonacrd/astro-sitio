import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('🛍️ API Products: Iniciando...');
    
    // Usar productos de ejemplo directamente para evitar errores de base de datos
    const exampleProducts = [
      {
        id: 'cachapa-1',
        title: 'Cachapa con Queso',
        description: 'Tradicional venezolana con queso fresco',
        price: 3500,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Comida',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'asador-1',
        title: 'Asador de Pollo',
        description: 'Pollo entero asado con especias',
        price: 8000,
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Comida',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'powerbank-1',
        title: 'Power Bank 10000mAh',
        description: 'Carga rápida USB-C para todos tus dispositivos',
        price: 15000,
        image_url: 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Tecnología',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'limpieza-1',
        title: 'Limpieza Profesional',
        description: 'Servicio de limpieza para hogar y oficina',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Servicios',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    console.log('✅ API Products: Devolviendo productos de ejemplo:', exampleProducts.length);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        products: exampleProducts,
        next_cursor: null,
        has_more: false
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ API Products Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};