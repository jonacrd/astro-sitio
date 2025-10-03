import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { orderId, newStatus, userType } = body;

    console.log('🔄 Actualizando estado de orden:', { orderId, newStatus, userType });

    if (!orderId || !newStatus) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de orden y nuevo estado son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

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

    // Actualizar el estado de la orden
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando orden:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando orden: ' + updateError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('✅ Orden actualizada:', updatedOrder);

    // Crear notificación para el usuario correspondiente
    const notificationData = {
      user_id: userType === 'seller' ? updatedOrder.user_id : updatedOrder.seller_id,
      type: 'order_status_update',
      title: `Estado de orden actualizado`,
      message: `Tu orden #${orderId} ahora está en estado: ${newStatus}`,
      data: {
        orderId: orderId,
        newStatus: newStatus,
        updatedAt: new Date().toISOString()
      }
    };

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData);

    if (notificationError) {
      console.log('⚠️ No se pudo crear notificación:', notificationError.message);
    } else {
      console.log('✅ Notificación creada');
    }

    // 📱 ENVIAR NOTIFICACIÓN PUSH con OneSignal
    if (userType === 'seller') {
      // Si el vendedor actualizó, notificar al cliente
      try {
        const onesignalAppId = '270896d8-ba2e-40bc-8f3b-c1e6efd258a1';
        const onesignalRestKey = import.meta.env.ONESIGNAL_REST_API_KEY || '';

        if (onesignalRestKey) {
          const notificationPayload = {
            app_id: onesignalAppId,
            include_aliases: {
              external_id: [updatedOrder.user_id]
            },
            target_channel: 'push',
            headings: { en: getPushNotificationTitle(newStatus) },
            contents: { en: getPushNotificationBody(newStatus, orderId) },
            data: {
              type: `order_${newStatus}`,
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
            console.log('✅ Notificación push OneSignal enviada al cliente:', result);
          } else {
            console.error('❌ Error enviando notificación push:', result);
          }
        } else {
          console.warn('⚠️ ONESIGNAL_REST_API_KEY no configurada');
        }
      } catch (pushError) {
        console.error('⚠️ Error enviando notificación push (no crítico):', pushError);
      }
    }

    // Disparar evento de notificación en el cliente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('order-status-updated', {
        detail: {
          orderId: orderId,
          newStatus: newStatus,
          updatedAt: new Date().toISOString()
        }
      }));
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        order: updatedOrder,
        message: 'Estado de orden actualizado correctamente'
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en endpoint de actualización de estado:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

function getPushNotificationTitle(status: string): string {
  switch (status) {
    case 'seller_confirmed':
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
    case 'seller_confirmed':
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
