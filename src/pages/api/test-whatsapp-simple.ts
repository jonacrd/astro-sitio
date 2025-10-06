// Endpoint simple para probar WhatsApp
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Test WhatsApp endpoint called');
    
    // Simular envío de WhatsApp
    const testPhone = '+56962614851';
    const testMessage = '🛒 NUEVO PEDIDO RECIBIDO\n\nID: TEST_ORDER_001\n\nVe a tu dashboard para confirmar el pedido.';
    
    console.log(`📱 Simulando WhatsApp a ${testPhone}: ${testMessage}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'WhatsApp simulado enviado',
      phone: testPhone,
      message: testMessage,
      note: 'En desarrollo, solo se simula. En producción se enviaría realmente.'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en test WhatsApp simple:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
