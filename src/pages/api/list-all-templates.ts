import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD';
    
    console.log('🔍 LIST: Listando todas las plantillas disponibles...');
    console.log('🔍 LIST: Token presente:', !!WHATSAPP_TOKEN);
    
    // Intentar diferentes endpoints para obtener plantillas
    const endpoints = [
      `https://graph.facebook.com/v18.0/me`,
      `https://graph.facebook.com/v18.0/me?fields=id,name`,
      `https://graph.facebook.com/v18.0/me?fields=id,name,message_templates`,
      `https://graph.facebook.com/v18.0/me?fields=id,name,message_templates{name,status,language}`,
      `https://graph.facebook.com/v18.0/me?fields=id,name,message_templates{name,status,language,components}`,
      `https://graph.facebook.com/v18.0/me?fields=id,name,message_templates{name,status,language,components{type,text}}`,
      // Endpoints específicos para WhatsApp Business
      `https://graph.facebook.com/v18.0/me?fields=id,name,whatsapp_business_accounts`,
      `https://graph.facebook.com/v18.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates}`,
      `https://graph.facebook.com/v18.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language}}`,
      `https://graph.facebook.com/v18.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language,components}}`,
      // Endpoints directos para WhatsApp Business
      `https://graph.facebook.com/v18.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language,components}}`,
      // Endpoints alternativos
      `https://graph.facebook.com/v18.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language,components}}`,
      // Endpoints con diferentes versiones de API
      `https://graph.facebook.com/v17.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language}}`,
      `https://graph.facebook.com/v16.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language}}`,
      // Endpoints alternativos para WhatsApp Business
      `https://graph.facebook.com/v18.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language,components}}`,
      // Endpoints con diferentes versiones de API
      `https://graph.facebook.com/v17.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language}}`,
      `https://graph.facebook.com/v16.0/me?fields=id,name,whatsapp_business_accounts{id,name,message_templates{name,status,language}}`
    ];
    
    const results: any = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 LIST: Probando endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          }
        });
        
        const result = await response.json();
        console.log(`🔍 LIST: Resultado ${endpoint}:`, JSON.stringify(result, null, 2));
        
        results[endpoint] = {
          success: response.ok,
          data: result,
          error: result.error?.message || null
        };
        
      } catch (error: any) {
        console.error(`🔍 LIST: Error en ${endpoint}:`, error);
        results[endpoint] = {
          success: false,
          error: error.message
        };
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Endpoints probados',
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🔍 LIST: Error listando plantillas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
