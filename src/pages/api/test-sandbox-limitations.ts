import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD';
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || import.meta.env.WHATSAPP_PHONE_ID || '773488772522546';
    
    console.log('🧪 SANDBOX: Probando limitaciones del sandbox...');
    console.log('🧪 SANDBOX: Token presente:', !!WHATSAPP_TOKEN);
    console.log('🧪 SANDBOX: Phone ID:', WHATSAPP_PHONE_ID);
    
    // Probar diferentes tipos de mensajes para identificar limitaciones
    const tests = [
      {
        name: 'hello_world básico',
        message: {
          messaging_product: 'whatsapp',
          to: '56962614851',
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'en_US'
            }
          }
        }
      },
      {
        name: 'hello_world en español',
        message: {
          messaging_product: 'whatsapp',
          to: '56962614851',
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'es_ES'
            }
          }
        }
      },
      {
        name: 'hello_world con parámetros',
        message: {
          messaging_product: 'whatsapp',
          to: '56962614851',
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'en_US'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: 'Test' }
                ]
              }
            ]
          }
        }
      },
      {
        name: 'order_management_1 (plantilla personalizada)',
        message: {
          messaging_product: 'whatsapp',
          to: '56962614851',
          type: 'template',
          template: {
            name: 'order_management_1',
            language: {
              code: 'es_ES'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: 'Test Vendedor' },
                  { type: 'text', text: 'nueva orden' }
                ]
              }
            ]
          }
        }
      }
    ];
    
    const results: any = {};
    
    for (const test of tests) {
      try {
        console.log(`🧪 SANDBOX: Probando: ${test.name}`);
        
        const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(test.message)
        });
        
        const result = await response.json();
        console.log(`🧪 SANDBOX: Resultado ${test.name}:`, JSON.stringify(result, null, 2));
        
        results[test.name] = {
          success: response.ok,
          data: result,
          error: result.error?.message || null,
          code: result.error?.code || null
        };
        
      } catch (error: any) {
        console.error(`🧪 SANDBOX: Error en ${test.name}:`, error);
        results[test.name] = {
          success: false,
          error: error.message,
          code: 'NETWORK_ERROR'
        };
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Pruebas de sandbox completadas',
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🧪 SANDBOX: Error probando sandbox:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
