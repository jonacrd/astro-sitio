import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token, phoneId } = await request.json();
    
    if (!token || !phoneId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token y Phone ID son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔧 PERMANENT: Configurando token permanente...');
    console.log('🔧 PERMANENT: Token presente:', !!token);
    console.log('🔧 PERMANENT: Phone ID:', phoneId);
    
    // Probar el token permanente con plantillas personalizadas
    const testTemplates = [
      {
        name: 'hello_world',
        description: 'Plantilla básica'
      },
      {
        name: 'order_management_1',
        description: 'Plantilla personalizada para vendedor'
      },
      {
        name: 'order_confirmed',
        description: 'Plantilla personalizada para comprador'
      }
    ];
    
    const results: any = {};
    
    for (const template of testTemplates) {
      try {
        console.log(`🔧 PERMANENT: Probando plantilla: ${template.name}`);
        
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '56962614851',
            type: 'template',
            template: {
              name: template.name,
              language: {
                code: 'es_ES'
              },
              components: template.name === 'hello_world' ? [] : [
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
        
        const result = await response.json();
        console.log(`🔧 PERMANENT: Resultado ${template.name}:`, JSON.stringify(result, null, 2));
        
        results[template.name] = {
          success: response.ok,
          data: result,
          error: result.error?.message || null,
          code: result.error?.code || null,
          description: template.description
        };
        
      } catch (error: any) {
        console.error(`🔧 PERMANENT: Error en ${template.name}:`, error);
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
      successfulTemplates: successfulTemplates,
      failedTemplates: failedTemplates,
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🔧 PERMANENT: Error configurando token permanente:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


