import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Simular prueba de plantilla para generar logs
    const { sendWhatsAppAutomation } = await import('../../server/whatsapp-automation');
    
    console.log('🔍 LOGS: Iniciando prueba de plantilla para generar logs');
    
    // Probar una plantilla
    const result = await sendWhatsAppAutomation(
      '+56962614851',
      'Test order_management_1',
      'order_management_1',
      ['Test Vendedor', 'nueva orden']
    );
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Logs generados en el servidor',
      result: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🔍 LOGS: Error generando logs:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};