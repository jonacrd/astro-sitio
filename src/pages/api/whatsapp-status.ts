// Endpoint para verificar el estado de WhatsApp
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const hasToken = !!process.env.WHATSAPP_TOKEN;
    const hasPhoneId = !!process.env.WHATSAPP_PHONE_ID;
    const isConfigured = hasToken && hasPhoneId;
    
    return new Response(JSON.stringify({
      success: true,
      configured: isConfigured,
      hasToken,
      hasPhoneId,
      mode: isConfigured ? 'REAL' : 'SIMULATED',
      message: isConfigured 
        ? 'WhatsApp configurado - envío automático activo' 
        : 'WhatsApp no configurado - usando modo simulado',
      instructions: isConfigured 
        ? 'El sistema enviará WhatsApp automáticamente'
        : 'Configura WHATSAPP_TOKEN y WHATSAPP_PHONE_ID en Vercel'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


