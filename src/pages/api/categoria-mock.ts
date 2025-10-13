import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('🚀 Iniciando API mock de categoría...');
    
    const categoria = url.searchParams.get('categoria');
    console.log('📝 Categoría solicitada:', categoria);
    
    if (!categoria) {
      return new Response(JSON.stringify({ error: 'Categoría no especificada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Datos mock para cada categoría
    const mockData = {
      minimarkets: {
        vendors: [
          {
            id: 'vendor-1',
            name: 'Minimarket Central',
            phone: '+56912345678',
            isActive: true,
            products: [
              {
                id: 'prod-1',
                title: 'Leche Liquida Soprole 1lt',
                price_cents: 1500,
                image_url: '/images/products/minimarket/leche-liquida-soprole-1lt.png',
                stock: 50,
                seller_id: 'vendor-1',
                category: 'minimarkets'
              },
              {
                id: 'prod-2',
                title: 'Pan Lactal Ideal',
                price_cents: 2500,
                image_url: '/images/products/minimarket/pan-lactal-ideal.webp',
                stock: 30,
                seller_id: 'vendor-1',
                category: 'minimarkets'
              }
            ]
          }
        ]
      },
      restaurantes: {
        vendors: [
          {
            id: 'vendor-2',
            name: 'Restaurante El Buen Sabor',
            phone: '+56987654321',
            isActive: true,
            products: [
              {
                id: 'prod-3',
                title: 'Pizza de Peperoni',
                price_cents: 8000,
                image_url: '/images/products/comida/pizza-de-peperoni.webp',
                stock: 10,
                seller_id: 'vendor-2',
                category: 'restaurantes'
              }
            ]
          }
        ]
      },
      mascotas: {
        vendors: []
      },
      medicinas: {
        vendors: []
      },
      postres: {
        vendors: []
      },
      carniceria: {
        vendors: []
      },
      servicios: {
        vendors: []
      },
      ninos: {
        vendors: []
      }
    };

    const categoryData = mockData[categoria as keyof typeof mockData];
    
    if (!categoryData) {
      return new Response(JSON.stringify({ 
        error: 'Categoría no encontrada',
        availableCategories: Object.keys(mockData)
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const vendors = categoryData.vendors;
    const allProducts = vendors.flatMap(v => v.products);
    
    const stats = {
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.isActive).length,
      totalProducts: allProducts.length,
      hasProducts: allProducts.length > 0
    };

    const message = stats.hasProducts 
      ? `Encontrados ${stats.totalProducts} productos de ${stats.activeVendors} vendedores activos (datos de prueba)`
      : `No hay productos disponibles en la categoría "${categoria}" en este momento.`;

    console.log('✅ Respuesta mock preparada:', stats);

    return new Response(JSON.stringify({
      success: true,
      categoria,
      stats,
      vendors,
      products: allProducts,
      message,
      isMockData: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en API mock:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


