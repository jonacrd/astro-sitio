// Test simple de WhatsApp
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 TEST SIMPLE: Probando WhatsApp con token nuevo');
    
    const WHATSAPP_TOKEN = 'EAA1Dzgz00SIBPukOaVGjPZAilsypFebOSp2c5cKlZB0XdQ2P7Xq8jdISXCCZBSm7QjLoPpVwbDM3KpzKNBhYdT6yoKAH8EgMJxx9hIvMi5RZA3Xe56ylG8mf7PEnlkfmcwNZCvAoDRRNUA56CHGPGvZAfnc0yEDLjAIcyagUZBAB7EZAXROs4PYtNutBlNjySOWYZApNt7rDOSYw0mVvJi7XDGA4P29mVl8yoZB0zeXbVunDG99pq6XjaIiZA5B';
    const WHATSAPP_PHONE_ID = '773488772522546';
    const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;
    
    console.log('🔍 Token length:', WHATSAPP_TOKEN.length);
    console.log('🔍 Phone ID:', WHATSAPP_PHONE_ID);
    console.log('🔍 API URL:', WHATSAPP_API_URL);
    
    const testMessage = `🧪 TEST SIMPLE DE WHATSAPP\n\nEste es un mensaje de prueba para verificar que el sistema funciona correctamente.\n\nTimestamp: ${new Date().toLocaleString()}`;
    
    console.log('📱 Enviando mensaje de prueba...');
    
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '56962614851', // Sin el +
        type: 'text',
        text: {
          body: testMessage,
        },
      }),
    });

    const result = await response.json();
    
    console.log('📱 Response status:', response.status);
    console.log('📱 Response body:', result);
    
    if (response.ok) {
      console.log('✅ TEST SIMPLE: WhatsApp enviado exitosamente');
      return new Response(JSON.stringify({
        success: true,
        message: 'WhatsApp enviado exitosamente',
        messageId: result.messages?.[0]?.id,
        response: result
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('❌ TEST SIMPLE: Error enviando WhatsApp:', result);
      return new Response(JSON.stringify({
        success: false,
        error: result.error?.message || 'Error desconocido',
        response: result
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error: any) {
    console.error('❌ TEST SIMPLE: Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};