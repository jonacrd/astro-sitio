import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD';
    
    console.log('🔍 FIND V2: Buscando WhatsApp Business Account con enfoque correcto...');
    console.log('🔍 FIND V2: Token presente:', !!WHATSAPP_TOKEN);
    
    // Intentar diferentes enfoques para encontrar WhatsApp Business Account
    const approaches = [
      // Enfoque 1: Buscar a través de pages con más campos
      {
        name: 'Pages con más campos',
        endpoint: `https://graph.facebook.com/v18.0/me?fields=id,name,accounts{id,name,category,whatsapp_business_accounts}`,
        description: 'Buscar a través de accounts con WhatsApp Business'
      },
      // Enfoque 2: Buscar a través de pages con WhatsApp Business
      {
        name: 'Pages con WhatsApp Business',
        endpoint: `https://graph.facebook.com/v18.0/me?fields=id,name,accounts{id,name,category,whatsapp_business_accounts{id,name,message_templates}}`,
        description: 'Buscar a través de accounts con WhatsApp Business y plantillas'
      },
      // Enfoque 3: Buscar a través de pages con WhatsApp Business y plantillas
      {
        name: 'Pages con WhatsApp Business y plantillas',
        endpoint: `https://graph.facebook.com/v18.0/me?fields=id,name,accounts{id,name,category,whatsapp_business_accounts{id,name,message_templates{name,status,language}}}`,
        description: 'Buscar a través de accounts con WhatsApp Business y plantillas detalladas'
      },
      // Enfoque 4: Buscar a través de pages con WhatsApp Business y plantillas completas
      {
        name: 'Pages con WhatsApp Business y plantillas completas',
        endpoint: `https://graph.facebook.com/v18.0/me?fields=id,name,accounts{id,name,category,whatsapp_business_accounts{id,name,message_templates{name,status,language,components}}}`,
        description: 'Buscar a través de accounts con WhatsApp Business y plantillas completas'
      }
    ];
    
    const results: any = {};
    
    for (const approach of approaches) {
      try {
        console.log(`🔍 FIND V2: Probando enfoque: ${approach.name}`);
        console.log(`🔍 FIND V2: Endpoint: ${approach.endpoint}`);
        
        const response = await fetch(approach.endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          }
        });
        
        const result = await response.json();
        console.log(`🔍 FIND V2: Resultado ${approach.name}:`, JSON.stringify(result, null, 2));
        
        results[approach.name] = {
          success: response.ok,
          data: result,
          error: result.error?.message || null,
          description: approach.description
        };
        
      } catch (error: any) {
        console.error(`🔍 FIND V2: Error en ${approach.name}:`, error);
        results[approach.name] = {
          success: false,
          error: error.message,
          description: approach.description
        };
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Enfoques V2 probados',
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🔍 FIND V2: Error buscando WhatsApp Business:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
