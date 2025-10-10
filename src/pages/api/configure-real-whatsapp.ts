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
    
    console.log('🔧 CONFIGURE: Configurando WhatsApp real...');
    console.log('🔧 CONFIGURE: Token presente:', !!token);
    console.log('🔧 CONFIGURE: Phone ID:', phoneId);
    
    // Probar el token real
    const testResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
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
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      })
    });
    
    const testResult = await testResponse.json();
    console.log('🔧 CONFIGURE: Resultado de prueba:', JSON.stringify(testResult, null, 2));
    
    if (testResponse.ok) {
      // Actualizar el token en el código (temporalmente)
      console.log('🔧 CONFIGURE: Token real funcionando correctamente');
      
      return new Response(JSON.stringify({
        success: true,
        message: 'WhatsApp real configurado correctamente',
        testResult: testResult
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('🔧 CONFIGURE: Error con token real:', testResult);
      
      return new Response(JSON.stringify({
        success: false,
        error: testResult.error?.message || 'Error desconocido',
        details: testResult
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error: any) {
    console.error('🔧 CONFIGURE: Error configurando WhatsApp real:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



