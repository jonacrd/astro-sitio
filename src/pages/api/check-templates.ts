import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD';
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || import.meta.env.WHATSAPP_PHONE_ID || '773488772522546';
    
    console.log('🔍 CHECK: Verificando plantillas en Meta...');
    console.log('🔍 CHECK: Token presente:', !!WHATSAPP_TOKEN);
    console.log('🔍 CHECK: Phone ID:', WHATSAPP_PHONE_ID);
    
    // Verificar plantillas disponibles
    const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/message_templates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    console.log('🔍 CHECK: Respuesta de Meta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      const templates = result.data || [];
      const templateNames = templates.map((t: any) => t.name);
      
      console.log('🔍 CHECK: Plantillas disponibles:', templateNames);
      
      // Verificar si nuestras plantillas existen
      const ourTemplates = ['order_management_1', 'order_confirmed', 'order_on_the_way', 'order_delivered'];
      const missingTemplates = ourTemplates.filter(name => !templateNames.includes(name));
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Plantillas verificadas',
        totalTemplates: templates.length,
        availableTemplates: templateNames,
        ourTemplates: ourTemplates,
        missingTemplates: missingTemplates,
        allTemplates: templates
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('🔍 CHECK: Error verificando plantillas:', result);
      return new Response(JSON.stringify({
        success: false,
        error: result.error?.message || 'Error verificando plantillas',
        details: result
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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
