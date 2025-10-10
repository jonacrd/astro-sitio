import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { phone } = await request.json();
    const testPhone = phone || '+56962614851';
    
    console.log('🧪 TEST PERMANENT: Probando token permanente...');
    console.log('🧪 TEST PERMANENT: Teléfono de prueba:', testPhone);
    
    // Configuración del token permanente
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPrZCcsXmdnlzR2df9qqGSpZBUPO4kLCvZA6857w6zm7HoagzQe0zdh6QR5ZAbq8HqpAHsTHyFOayYUF2IhROTReW8FPMuN8ZC2EO7NgZC9ixddoLNHPB3x5XVhUrWSmRZAXq2MU1lBSSBbv4NpIgDjCzWNH7ZCZBRM6gO4zJJEf05QYKh2Niw8AZDZD';
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || import.meta.env.WHATSAPP_PHONE_ID || '741455765727385';
    
    console.log('🧪 TEST PERMANENT: Token presente:', !!WHATSAPP_TOKEN);
    console.log('🧪 TEST PERMANENT: Phone ID:', WHATSAPP_PHONE_ID);
    
    // Probar diferentes plantillas
    const testTemplates = [
      {
        name: 'hello_world',
        description: 'Plantilla básica',
        params: []
      },
      {
        name: 'order_management_1',
        description: 'Plantilla para vendedor',
        params: ['Test Vendedor', 'nueva orden']
      },
      {
        name: 'order_confirmed',
        description: 'Plantilla para comprador',
        params: ['Test Cliente', 'TEST_ORDER_001']
      },
      {
        name: 'order_on_the_way',
        description: 'Plantilla en camino',
        params: ['TEST_ORDER_001']
      },
      {
        name: 'order_delivered',
        description: 'Plantilla entregado',
        params: ['Test Cliente']
      }
    ];
    
    const results: any = {};
    
    for (const template of testTemplates) {
      try {
        console.log(`🧪 TEST PERMANENT: Probando plantilla: ${template.name}`);
        
        const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: testPhone.startsWith('+') ? testPhone.substring(1) : testPhone,
            type: 'template',
            template: {
              name: template.name,
              language: {
                code: 'es_ES'
              },
              components: template.params.length > 0 ? [
                {
                  type: 'body',
                  parameters: template.params.map(param => ({
                    type: 'text',
                    text: param
                  }))
                }
              ] : []
            }
          })
        });
        
        const result = await response.json();
        console.log(`🧪 TEST PERMANENT: Resultado ${template.name}:`, JSON.stringify(result, null, 2));
        
        results[template.name] = {
          success: response.ok,
          data: result,
          error: result.error?.message || null,
          code: result.error?.code || null,
          description: template.description
        };
        
      } catch (error: any) {
        console.error(`🧪 TEST PERMANENT: Error en ${template.name}:`, error);
        results[template.name] = {
          success: false,
          error: error.message,
          code: 'NETWORK_ERROR',
          description: template.description
        };
      }
    }
    
    const successfulTemplates = Object.entries(results).filter(([_, result]: [string, any]) => result.success).map(([name, _]) => name);
    const failedTemplates = Object.entries(results).filter(([_, result]: [string, any]) => !result.success).map(([name, _]) => name);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Token permanente probado',
      token: WHATSAPP_TOKEN,
      phoneId: WHATSAPP_PHONE_ID,
      testPhone: testPhone,
      successfulTemplates: successfulTemplates,
      failedTemplates: failedTemplates,
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🧪 TEST PERMANENT: Error probando token permanente:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



