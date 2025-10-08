import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD';
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || import.meta.env.WHATSAPP_PHONE_ID || '773488772522546';
    
    console.log('🔍 CHECK: Verificando plantillas en Meta...');
    console.log('🔍 CHECK: Token presente:', !!WHATSAPP_TOKEN);
    console.log('🔍 CHECK: Phone ID:', WHATSAPP_PHONE_ID);
    
    // Probar directamente las plantillas enviando mensajes
    const ourTemplates = ['order_management_1', 'order_confirmed', 'order_on_the_way', 'order_delivered'];
    const results: any = {};
    
    console.log('🔍 CHECK: Probando plantillas directamente...');
    
    for (const templateName of ourTemplates) {
      try {
        console.log(`🔍 CHECK: Probando plantilla: ${templateName}`);
        
        const testResponse = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '56962614851',
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: 'es_ES'
              },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: 'Test' },
                    { type: 'text', text: 'Test' }
                  ]
                }
              ]
            }
          })
        });
        
        const testResult = await testResponse.json();
        console.log(`🔍 CHECK: Resultado ${templateName}:`, JSON.stringify(testResult, null, 2));
        
        results[templateName] = {
          success: testResponse.ok,
          error: testResult.error?.message || null,
          code: testResult.error?.code || null
        };
        
      } catch (error: any) {
        console.error(`🔍 CHECK: Error probando ${templateName}:`, error);
        results[templateName] = {
          success: false,
          error: error.message,
          code: 'NETWORK_ERROR'
        };
      }
    }
    
    const successfulTemplates = Object.entries(results).filter(([_, result]: [string, any]) => result.success).map(([name, _]) => name);
    const failedTemplates = Object.entries(results).filter(([_, result]: [string, any]) => !result.success).map(([name, _]) => name);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Plantillas probadas directamente',
      successfulTemplates: successfulTemplates,
      failedTemplates: failedTemplates,
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🔍 CHECK: Error verificando plantillas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
