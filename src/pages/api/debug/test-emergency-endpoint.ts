import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Test endpoint de emergencia iniciado...');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Endpoint de emergencia funcionando correctamente',
      timestamp: new Date().toISOString(),
      test: {
        orders: [
          {
            id: 'test-123',
            total_cents: 1500,
            status: 'pending',
            items: [
              {
                title: 'Leche Liquida Soprole 1lt',
                price_cents: 1500,
                qty: 1
              }
            ]
          }
        ]
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en test endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
