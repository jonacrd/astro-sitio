import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, title, message } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'userId es requerido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const onesignalAppId = '270896d8-ba2e-40bc-8f3b-c1e6efd258a1';
    const onesignalRestKey = process.env.ONESIGNAL_REST_API_KEY || '';

    if (!onesignalRestKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ONESIGNAL_REST_API_KEY no configurada'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('🧪 TEST: Enviando notificación a:', userId);

    const notificationPayload = {
      app_id: onesignalAppId,
      include_aliases: {
        external_id: [userId]
      },
      target_channel: 'push',
      headings: { en: title || '🧪 Prueba de Notificación' },
      contents: { en: message || 'Esta es una notificación de prueba' },
      chrome_web_icon: '/favicon.svg',
      firefox_icon: '/favicon.svg'
    };

    console.log('📦 Payload:', JSON.stringify(notificationPayload, null, 2));

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${onesignalRestKey}`
      },
      body: JSON.stringify(notificationPayload)
    });

    const result = await response.json();

    console.log('📊 Respuesta de OneSignal:', result);

    if (response.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Notificación enviada',
        result: result
      }), {
        headers: { 'content-type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error enviando notificación',
        details: result
      }), {
        status: response.status,
        headers: { 'content-type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};




