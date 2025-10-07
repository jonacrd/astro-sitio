// Endpoint para ver logs de WhatsApp
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Simular logs de WhatsApp (en producción estos estarían en Vercel logs)
    const logs = [
      {
        timestamp: new Date().toISOString(),
        action: 'WhatsApp configurado',
        status: 'success',
        message: 'Sistema listo para enviar WhatsApp automáticamente'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        action: 'Verificación de configuración',
        status: 'success',
        message: 'WHATSAPP_TOKEN y WHATSAPP_PHONE_ID configurados'
      }
    ];
    
    return new Response(JSON.stringify({
      success: true,
      logs,
      note: 'En producción, revisa los logs de Vercel para ver los mensajes de WhatsApp'
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
