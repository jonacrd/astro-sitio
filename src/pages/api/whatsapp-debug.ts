// Endpoint para debug de WhatsApp
import type { APIRoute } from 'astro';
import { sendRealWhatsApp } from '../../server/whatsapp-real';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { phone, message } = await request.json();
    
    console.log('🔍 DEBUG: Enviando WhatsApp a:', phone);
    console.log('🔍 DEBUG: Mensaje:', message);
    
    // Verificar variables de entorno
    const hasToken = !!process.env.WHATSAPP_TOKEN;
    const hasPhoneId = !!process.env.WHATSAPP_PHONE_ID;
    
    console.log('🔍 DEBUG: Variables configuradas:', {
      hasToken,
      hasPhoneId,
      tokenLength: process.env.WHATSAPP_TOKEN?.length || 0,
      phoneId: process.env.WHATSAPP_PHONE_ID
    });
    
    // Intentar enviar WhatsApp
    const result = await sendRealWhatsApp(phone, message);
    
    console.log('🔍 DEBUG: Resultado:', result);
    
    return new Response(JSON.stringify({
      success: true,
      debug: {
        phone,
        message,
        hasToken,
        hasPhoneId,
        result
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ DEBUG Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

