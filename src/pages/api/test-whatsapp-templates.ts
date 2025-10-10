import type { APIRoute } from 'astro';
import { sendWhatsAppAutomation } from '../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { phone } = await request.json();
    const testPhone = phone || '+56962614851';
    
    console.log('🧪 TEST: Iniciando prueba de plantillas WhatsApp');
    console.log('🧪 TEST: Teléfono:', testPhone);
    
    // Probar plantilla order_management_1
    console.log('🧪 TEST: Probando order_management_1...');
    const result1 = await sendWhatsAppAutomation(
      testPhone,
      'Test order_management_1',
      'order_management_1',
      ['Test Vendedor', 'nueva orden']
    );
    console.log('🧪 TEST: Resultado order_management_1:', result1);
    
    // Probar plantilla order_confirmed
    console.log('🧪 TEST: Probando order_confirmed...');
    const result2 = await sendWhatsAppAutomation(
      testPhone,
      'Test order_confirmed',
      'order_confirmed',
      ['Test Cliente', 'TEST_ORDER_001']
    );
    console.log('🧪 TEST: Resultado order_confirmed:', result2);
    
    // Probar plantilla order_on_the_way
    console.log('🧪 TEST: Probando order_on_the_way...');
    const result3 = await sendWhatsAppAutomation(
      testPhone,
      'Test order_on_the_way',
      'order_on_the_way',
      ['TEST_ORDER_001']
    );
    console.log('🧪 TEST: Resultado order_on_the_way:', result3);
    
    // Probar plantilla order_delivered
    console.log('🧪 TEST: Probando order_delivered...');
    const result4 = await sendWhatsAppAutomation(
      testPhone,
      'Test order_delivered',
      'order_delivered',
      ['Test Cliente']
    );
    console.log('🧪 TEST: Resultado order_delivered:', result4);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Pruebas de plantillas completadas',
      results: {
        order_management_1: result1,
        order_confirmed: result2,
        order_on_the_way: result3,
        order_delivered: result4
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('🧪 TEST: Error en prueba de plantillas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



