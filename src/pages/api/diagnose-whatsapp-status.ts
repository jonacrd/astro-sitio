import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 DIAGNOSE: Diagnosticando estado de WhatsApp...');
    
    // Obtener configuración actual
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD';
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || import.meta.env.WHATSAPP_PHONE_ID || '773488772522546';
    
    console.log('🔍 DIAGNOSE: Token presente:', !!WHATSAPP_TOKEN);
    console.log('🔍 DIAGNOSE: Phone ID:', WHATSAPP_PHONE_ID);
    
    // Probar diferentes endpoints de Meta para diagnosticar
    const endpoints = [
      {
        name: 'Información básica del token',
        url: `https://graph.facebook.com/v18.0/me?access_token=${WHATSAPP_TOKEN}`,
        description: 'Verifica si el token es válido'
      },
      {
        name: 'Información del número de teléfono',
        url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}?access_token=${WHATSAPP_TOKEN}`,
        description: 'Verifica el estado del número de WhatsApp'
      },
      {
        name: 'Plantillas disponibles',
        url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/message_templates?access_token=${WHATSAPP_TOKEN}`,
        description: 'Lista las plantillas disponibles'
      }
    ];
    
    const results: any = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 DIAGNOSE: Probando ${endpoint.name}...`);
        
        const response = await fetch(endpoint.url);
        const data = await response.json();
        
        console.log(`🔍 DIAGNOSE: Resultado ${endpoint.name}:`, JSON.stringify(data, null, 2));
        
        results[endpoint.name] = {
          success: response.ok,
          status: response.status,
          data: data,
          error: data.error?.message || null,
          code: data.error?.code || null,
          description: endpoint.description
        };
        
      } catch (error: any) {
        console.error(`🔍 DIAGNOSE: Error en ${endpoint.name}:`, error);
        results[endpoint.name] = {
          success: false,
          error: error.message,
          description: endpoint.description
        };
      }
    }
    
    // Determinar tipo de token
    let tokenType = 'Desconocido';
    if (WHATSAPP_TOKEN.includes('EAA')) {
      tokenType = 'Permanente';
    } else if (WHATSAPP_TOKEN.includes('EAAB')) {
      tokenType = 'Temporal';
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Diagnóstico completado',
      tokenType: tokenType,
      tokenPresent: !!WHATSAPP_TOKEN,
      phoneId: WHATSAPP_PHONE_ID,
      results: results,
      recommendations: [
        'Si el token es temporal, necesitas solicitar revisión en Meta',
        'Si no hay plantillas disponibles, necesitas crear plantillas personalizadas',
        'Si hay errores de permisos, necesitas solicitar permisos adicionales'
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🔍 DIAGNOSE: Error en diagnóstico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
