import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const categoria = url.searchParams.get('categoria') || 'postres';
    
    // Datos de ejemplo hardcodeados para probar
    const datosEjemplo = {
      postres: {
        stats: {
          totalVendors: 2,
          activeVendors: 2,
          totalProducts: 3
        },
        vendors: [
          {
            id: 'vendor-1',
            name: 'Dulces María',
            phone: '+56912345678',
            isActive: true,
            products: [
              {
                id: 'prod-1',
                title: 'Torta de Chocolate',
                price_cents: 15000,
                image_url: '/images/products/postres/torta-chocolate.jpg',
                stock: 5
              },
              {
                id: 'prod-2',
                title: 'Cupcakes de Vainilla',
                price_cents: 3000,
                image_url: '/images/products/postres/cupcakes.jpg',
                stock: 12
              }
            ]
          },
          {
            id: 'vendor-2',
            name: 'Postres Artesanales',
            phone: '+56987654321',
            isActive: true,
            products: [
              {
                id: 'prod-3',
                title: 'Helado de Fresa',
                price_cents: 5000,
                image_url: '/images/products/postres/helado-fresa.jpg',
                stock: 8
              }
            ]
          }
        ]
      },
      minimarkets: {
        stats: {
          totalVendors: 1,
          activeVendors: 1,
          totalProducts: 3
        },
        vendors: [
          {
            id: 'vendor-3',
            name: 'Minimarket El Vecino',
            phone: '+56911223344',
            isActive: true,
            products: [
              {
                id: 'prod-4',
                title: 'Leche Liquida Soprole 1lt',
                price_cents: 1200,
                image_url: '/images/products/minimarket/leche.jpg',
                stock: 20
              },
              {
                id: 'prod-5',
                title: 'Pan de Molde',
                price_cents: 2500,
                image_url: '/images/products/minimarket/pan.jpg',
                stock: 15
              },
              {
                id: 'prod-6',
                title: 'Huevos Frescos x12',
                price_cents: 3000,
                image_url: '/images/products/minimarket/huevos.jpg',
                stock: 10
              }
            ]
          }
        ]
      }
    };

    const datos = datosEjemplo[categoria] || datosEjemplo.postres;

    return new Response(JSON.stringify({
      success: true,
      categoria,
      stats: datos.stats,
      vendors: datos.vendors,
      message: 'Datos de ejemplo - categoría funcionando'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error en categoría simple',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
