import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { notifyCustomerOrderConfirmed, notifyDeliveryStatus } from '../../../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId y status son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`🔄 Actualizando pedido ${orderId} a estado: ${status}`);

    // Actualizar el estado del pedido
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando pedido:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando pedido: ' + updateError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('✅ Pedido actualizado:', updatedOrder);

    // Crear notificación para el comprador
    const notificationTitle = getNotificationTitle(status);
    const notificationMessage = getNotificationMessage(status, orderId);

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: updatedOrder.user_id,
        type: 'order_confirmed',
        title: notificationTitle,
        message: notificationMessage,
        order_id: orderId,
        is_read: false
      });

    if (notificationError) {
      console.log('⚠️ Error creando notificación (tabla puede no existir):', notificationError.message);
    } else {
      console.log('🔔 Notificación creada para el comprador');
    }

    // OneSignal (push) - existente
    try {
      const onesignalAppId = '270896d8-ba2e-40bc-8f3b-c1e6efd258a1';
      const onesignalRestKey = process.env.ONESIGNAL_REST_API_KEY || '';

      if (onesignalRestKey) {
        const notificationPayload = {
          app_id: onesignalAppId,
          include_aliases: {
            external_id: [updatedOrder.user_id]
          },
          target_channel: 'push',
          headings: { en: getPushNotificationTitle(status) },
          contents: { en: getPushNotificationBody(status, orderId) },
          data: {
            type: `order_${status}`,
            orderId,
            url: `/pedidos/${orderId}`,
            timestamp: new Date().toISOString()
          },
          url: `/pedidos/${orderId}`,
          chrome_web_icon: '/favicon.svg',
          firefox_icon: '/favicon.svg',
          chrome_web_badge: '/favicon.svg'
        };

        console.log('📬 Enviando notificación push al cliente:', updatedOrder.user_id);
        console.log('📦 Payload OneSignal:', JSON.stringify(notificationPayload, null, 2));

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${onesignalRestKey}`
          },
          body: JSON.stringify(notificationPayload)
        });

        const result = await response.json();

        if (response.ok) {
          console.log('✅ Notificación OneSignal enviada al cliente:', result);
        } else {
          console.error('❌ Error enviando notificación:', result);
        }
      } else {
        console.warn('⚠️ ONESIGNAL_REST_API_KEY no configurada');
      }
    } catch (pushError) {
      console.error('Error enviando notificación push:', pushError);
    }

    // WhatsApp auto (seguro y no bloqueante)
    try {
      const appBaseUrl = process.env.APP_BASE_URL || 'https://astro-sitio.vercel.app';

      // Obtener teléfonos y opt-in
      const [{ data: buyer }, { data: seller }] = await Promise.all([
        supabase.from('profiles').select('id, phone, opt_in_whatsapp').eq('id', updatedOrder.user_id).single(),
        supabase.from('profiles').select('id, phone, opt_in_whatsapp').eq('id', updatedOrder.seller_id).single()
      ]);

      const orderCode = String(orderId).substring(0, 8);
      const trackingUrl = `${appBaseUrl}/pedidos/${orderId}`;
      const confirmUrl = `${appBaseUrl}/dashboard/pedidos`;
      const rateUrl = `${appBaseUrl}/pedidos/${orderId}/calificar`;
      const pointsUrl = `${appBaseUrl}/perfil#puntos`;

      // NOTIFICACIONES AUTOMÁTICAS WHATSAPP
      if (status === 'confirmed') {
        console.log('📱 AUTOMÁTICO: Enviando WhatsApp al cliente sobre confirmación:', orderId);
        await notifyCustomerOrderConfirmed(orderId, updatedOrder.user_id);
        console.log('✅ AUTOMÁTICO: WhatsApp enviado al cliente');
      }
      
      // Si hay delivery activo, notificar status
      if (status === 'in_transit' || status === 'delivered') {
        await notifyDeliveryStatus('delivery_' + orderId, status, updatedOrder.seller_id, updatedOrder.user_id);
      }
      // Nota: el aviso al vendedor en "nuevo pedido" se enviará desde el endpoint de creación de pedido
    } catch (waErr) {
      console.error('WhatsApp notify error (no bloquea):', waErr);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        order: updatedOrder,
        message: `Pedido actualizado a ${status}`
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/orders/update:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

function getNotificationTitle(status: string): string {
  switch (status) {
    case 'confirmed':
      return '¡Pedido Confirmado!';
    case 'delivered':
      return '¡Pedido Entregado!';
    case 'completed':
      return '¡Pedido Completado!';
    default:
      return 'Estado del Pedido Actualizado';
  }
}

function getNotificationMessage(status: string, orderId: string): string {
  const orderCode = orderId.substring(0, 8);
  
  switch (status) {
    case 'confirmed':
      return `Tu pedido #${orderCode} ha sido confirmado por el vendedor. ¡Pronto será preparado!`;
    case 'delivered':
      return `¡Excelente! Tu pedido #${orderCode} ha sido entregado. ¡Esperamos que lo disfrutes!`;
    case 'completed':
      return `Tu pedido #${orderCode} ha sido completado. ¡Gracias por tu compra!`;
    default:
      return `El estado de tu pedido #${orderCode} ha sido actualizado a ${status}.`;
  }
}

function getPushNotificationTitle(status: string): string {
  switch (status) {
    case 'confirmed':
      return '✅ ¡Pedido Confirmado!';
    case 'preparing':
      return '👨‍🍳 ¡Preparando tu Pedido!';
    case 'in_transit':
      return '🚚 ¡Tu pedido va en camino!';
    case 'delivered':
      return '📦 ¡Tu pedido ha llegado!';
    case 'completed':
      return '🎉 ¡Pedido Completado!';
    default:
      return '📱 Estado del Pedido Actualizado';
  }
}

function getPushNotificationBody(status: string, orderId: string): string {
  const orderCode = orderId.substring(0, 8);
  
  switch (status) {
    case 'confirmed':
      return `Tu pedido #${orderCode} ha sido confirmado y está siendo preparado`;
    case 'preparing':
      return `Tu pedido #${orderCode} está siendo preparado con cuidado`;
    case 'in_transit':
      return `Tu pedido #${orderCode} ya está en camino. ¡Pronto llegará!`;
    case 'delivered':
      return `Tu pedido #${orderCode} ha llegado a tu dirección. ¡Baja a recibirlo!`;
    case 'completed':
      return `Tu pedido #${orderCode} ha sido completado exitosamente. ¡Gracias por tu compra!`;
    default:
      return `El estado de tu pedido #${orderCode} ha sido actualizado`;
  }
}