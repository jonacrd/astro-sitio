import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    console.log('🔍 Datos recibidos en checkout:', body);
    
    // Simular respuesta exitosa por ahora
    return new Response(JSON.stringify({
      success: true,
      message: 'Checkout procesado exitosamente',
      data: {
        orderId: 'test-order-123',
        totalCents: 35000,
        itemCount: 1,
        pointsAdded: 350
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en checkout simple:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};









