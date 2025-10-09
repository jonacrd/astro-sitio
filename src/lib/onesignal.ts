/**
 * Helper para enviar notificaciones push con OneSignal
 */

const ONESIGNAL_APP_ID = '270896d8-ba2e-40bc-8f3b-c1e6efd258a1';
const ONESIGNAL_REST_API_KEY = import.meta.env.PUBLIC_ONESIGNAL_REST_API_KEY || '';

export interface NotificationOptions {
  userId?: string;
  externalUserId?: string;
  title: string;
  message: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

/**
 * Envía una notificación push a un usuario específico
 */
export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  try {
    const {
      userId,
      externalUserId,
      title,
      message,
      url,
      icon = '/favicon.svg',
      badge = '/favicon.svg',
      data = {}
    } = options;

    // Construir el payload para OneSignal
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      small_icon: icon,
      large_icon: icon,
      chrome_web_icon: icon,
      firefox_icon: icon,
      chrome_web_badge: badge,
      data: data
    };

    // Si se proporciona un URL, redirigir al hacer click
    if (url) {
      payload.url = url;
    }

    // Filtrar por usuario
    if (externalUserId) {
      payload.include_external_user_ids = [externalUserId];
    } else if (userId) {
      payload.include_player_ids = [userId];
    } else {
      // Si no se especifica usuario, enviar a todos los suscritos
      payload.included_segments = ['All'];
    }

    console.log('📬 Enviando notificación con OneSignal:', payload);

    // Enviar la notificación
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Notificación enviada:', result);
      return true;
    } else {
      console.error('❌ Error enviando notificación:', result);
      return false;
    }

  } catch (error) {
    console.error('❌ Error en sendNotification:', error);
    return false;
  }
}

/**
 * Suscribe al usuario actual a notificaciones y lo registra con su ID
 */
export async function subscribeUser(userId: string): Promise<boolean> {
  try {
    // @ts-ignore
    if (typeof OneSignal === 'undefined') {
      console.error('OneSignal no está cargado');
      return false;
    }

    // @ts-ignore
    await OneSignal.login(userId);
    console.log('✅ Usuario suscrito con ID:', userId);
    return true;

  } catch (error) {
    console.error('❌ Error suscribiendo usuario:', error);
    return false;
  }
}

/**
 * Verifica si el usuario tiene notificaciones activadas
 */
export async function isSubscribed(): Promise<boolean> {
  try {
    // @ts-ignore
    if (typeof OneSignal === 'undefined') {
      return false;
    }

    // @ts-ignore
    const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
    return isPushEnabled;

  } catch (error) {
    console.error('❌ Error verificando suscripción:', error);
    return false;
  }
}

/**
 * Solicita permiso para notificaciones
 */
export async function requestPermission(): Promise<boolean> {
  try {
    // @ts-ignore
    if (typeof OneSignal === 'undefined') {
      console.error('OneSignal no está cargado');
      return false;
    }

    // @ts-ignore
    await OneSignal.Slidedown.promptPush();
    return true;

  } catch (error) {
    console.error('❌ Error solicitando permisos:', error);
    return false;
  }
}





