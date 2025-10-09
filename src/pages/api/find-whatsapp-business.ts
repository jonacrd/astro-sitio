import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD';
    
    console.log('🔍 FIND: Buscando WhatsApp Business Account...');
    console.log('🔍 FIND: Token presente:', !!WHATSAPP_TOKEN);
    
    // Intentar diferentes enfoques para encontrar WhatsApp Business Account
    const approaches = [
      // Enfoque 1: Buscar a través de business accounts
      {
        name: 'Business Accounts',
        endpoint: `https://graph.facebook.com/v18.0/me?fields=id,name,businesses`,
        description: 'Buscar a través de businesses'
      },
      // Enfoque 2: Buscar a través de pages
      {
        name: 'Pages',
        endpoint: `https://graph.facebook.com/v18.0/me?fields=id,name,accounts`,
        description: 'Buscar a través de accounts'
      },
      // Enfoque 3: Buscar a través de apps
      {
        name: 'Apps',
        endpoint: `https://graph.facebook.com/v18.0/me?fields=id,name,apps`,
        description: 'Buscar a través de apps'
      },
      // Enfoque 4: Buscar directamente WhatsApp Business
      {
        name: 'WhatsApp Business Direct',
        endpoint: `https://graph.facebook.com/v18.0/me?fields=id,name,whatsapp_business_accounts`,
        description: 'Buscar directamente WhatsApp Business'
      }
    ];
    
    const results: any = {};
    
    for (const approach of approaches) {
      try {
        console.log(`🔍 FIND: Probando enfoque: ${approach.name}`);
        console.log(`🔍 FIND: Endpoint: ${approach.endpoint}`);
        
        const response = await fetch(approach.endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          }
        });
        
        const result = await response.json();
        console.log(`🔍 FIND: Resultado ${approach.name}:`, JSON.stringify(result, null, 2));
        
        results[approach.name] = {
          success: response.ok,
          data: result,
          error: result.error?.message || null,
          description: approach.description
        };
        
      } catch (error: any) {
        console.error(`🔍 FIND: Error en ${approach.name}:`, error);
        results[approach.name] = {
          success: false,
          error: error.message,
          description: approach.description
        };
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Enfoques probados',
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🔍 FIND: Error buscando WhatsApp Business:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


