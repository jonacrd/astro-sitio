// Endpoint para probar WhatsApp real
import type { APIRoute } from 'astro';
import { sendRealWhatsApp } from '../../server/whatsapp-real';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { phone, message } = await request.json();
    
    if (!phone || !message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Phone y message son requeridos'
      }), { status: 400 });
    }

    console.log('🧪 Probando WhatsApp real...');
    const result = await sendRealWhatsApp(phone, message);
    
    return new Response(JSON.stringify({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      message: result.success ? 'WhatsApp enviado exitosamente' : 'Error enviando WhatsApp'
    }), { status: 200 });

  } catch (error: any) {
    console.error('❌ Error en test WhatsApp:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
};
