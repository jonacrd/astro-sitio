import { supabase } from './supabase-browser';
import { NOTIFICATION_TYPES, NOTIFICATION_MESSAGES } from './vapid-config';

interface NotificationData {
  userId: string;
  type: keyof typeof NOTIFICATION_TYPES;
  orderId?: string;
  productName?: string;
  customTitle?: string;
  customBody?: string;
}

/**
 * Enviar notificación push a un usuario específico
 */
export async function sendPushNotification(data: NotificationData) {
  try {
    const { userId, type, orderId, productName, customTitle, customBody } = data;

    // Obtener el mensaje predefinido o usar mensaje personalizado
    const notificationConfig = NOTIFICATION_MESSAGES[type] || NOTIFICATION_MESSAGES[NOTIFICATION_TYPES.GENERAL];
    
    let title = customTitle || notificationConfig.title;
    let body = customBody || notificationConfig.body;
    
    // Personalizar el mensaje según el tipo
    if (orderId) {
      body = `${body} - Pedido #${orderId}`;
    }
    
    if (productName) {
      body = `${body} - ${productName}`;
    }

    // Enviar notificación a través de Supabase Edge Function
    const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
        title,
        body,
        icon: notificationConfig.icon,
        badge: notificationConfig.icon,
        tag: `${type}-${orderId || Date.now()}`,
        data: {
          type,
          orderId,
          productName,
          url: orderId ? `/pedidos/${orderId}` : '/',
          timestamp: new Date().toISOString()
        }
      }
    });

    if (error) {
      console.error('Error enviando notificación:', error);
      return { success: false, error };
    }

    console.log('✅ Notificación enviada:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error inesperado enviando notificación:', error);
    return { success: false, error };
  }
}

/**
 * Notificar al vendedor cuando recibe un pedido
 */
export async function notifySellerNewOrder(sellerId: string, orderId: string, productName: string) {
  return sendPushNotification({
    userId: sellerId,
    type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
    orderId,
    productName,
    customTitle: '🛒 ¡Nuevo Pedido Recibido!',
    customBody: `Tienes un nuevo pedido de ${productName}`
  });
}

/**
 * Notificar al cliente cuando su pedido es confirmado
 */
export async function notifyBuyerOrderConfirmed(buyerId: string, orderId: string, productName: string) {
  return sendPushNotification({
    userId: buyerId,
    type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
    orderId,
    productName,
    customTitle: '✅ ¡Pedido Confirmado!',
    customBody: `Tu pedido de ${productName} ha sido confirmado`
  });
}

/**
 * Notificar al cliente cuando su pedido está en camino
 */
export async function notifyBuyerOrderInTransit(buyerId: string, orderId: string, productName: string) {
  return sendPushNotification({
    userId: buyerId,
    type: NOTIFICATION_TYPES.ORDER_IN_TRANSIT,
    orderId,
    productName,
    customTitle: '🚚 ¡Tu pedido está en camino!',
    customBody: `Tu pedido de ${productName} ha salido para entrega`
  });
}

/**
 * Notificar al cliente cuando su pedido ha llegado
 */
export async function notifyBuyerOrderDelivered(buyerId: string, orderId: string, productName: string) {
  return sendPushNotification({
    userId: buyerId,
    type: NOTIFICATION_TYPES.ORDER_DELIVERED,
    orderId,
    productName,
    customTitle: '📦 ¡Tu pedido ha llegado!',
    customBody: `Tu pedido de ${productName} ha llegado. ¡Baja a recibirlo!`
  });
}

/**
 * Notificar al cliente cuando su pedido está completado
 */
export async function notifyBuyerOrderCompleted(buyerId: string, orderId: string, productName: string) {
  return sendPushNotification({
    userId: buyerId,
    type: NOTIFICATION_TYPES.ORDER_COMPLETED,
    orderId,
    productName,
    customTitle: '🎉 ¡Pedido Completado!',
    customBody: `Tu pedido de ${productName} ha sido completado. ¡Gracias por tu compra!`
  });
}

/**
 * Notificar una promoción especial
 */
export async function notifyPromotion(userId: string, promotionTitle: string, promotionBody: string) {
  return sendPushNotification({
    userId,
    type: NOTIFICATION_TYPES.PROMOTION,
    customTitle: promotionTitle,
    customBody: promotionBody
  });
}

/**
 * Enviar notificación a todos los usuarios (broadcast)
 */
export async function notifyAllUsers(title: string, body: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        title,
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `broadcast-${Date.now()}`,
        data: {
          type: 'broadcast',
          url: '/',
          timestamp: new Date().toISOString()
        }
      }
    });

    if (error) {
      console.error('Error enviando notificación broadcast:', error);
      return { success: false, error };
    }

    console.log('✅ Notificación broadcast enviada:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error inesperado enviando notificación broadcast:', error);
    return { success: false, error };
  }
}


