// Configuración de VAPID Keys para notificaciones push
export const VAPID_PUBLIC_KEY = 'BLIN_3ixEukqa9oJeknk549vgbk-1C9DqBNsNgUaCte4SCc7a6xUZv589gIOGr9PHDsBDliy4S87xBRmIoSlrVI';
export const VAPID_PRIVATE_KEY = 'hH4fbz2dMuSBjKORRYNduA1wvYLXIoFKOCa6Amn92HY';

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  title: 'Town App',
  icon: '/favicon.svg',
  badge: '/favicon.svg',
  tag: 'town-notification',
  requireInteraction: true,
  actions: [
    {
      action: 'open',
      title: 'Abrir App',
      icon: '/favicon.svg'
    },
    {
      action: 'close',
      title: 'Cerrar',
      icon: '/favicon.svg'
    }
  ]
};

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_IN_TRANSIT: 'order_in_transit',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_COMPLETED: 'order_completed',
  PROMOTION: 'promotion',
  GENERAL: 'general'
} as const;

// Mensajes de notificaciones
export const NOTIFICATION_MESSAGES = {
  [NOTIFICATION_TYPES.ORDER_CONFIRMED]: {
    title: '¡Pedido Confirmado! 🎉',
    body: 'Tu pedido ha sido confirmado y está siendo preparado',
    icon: '/favicon.svg'
  },
  [NOTIFICATION_TYPES.ORDER_IN_TRANSIT]: {
    title: '¡Tu pedido está en camino! 🚚',
    body: 'Tu pedido ha salido y está en camino a tu dirección',
    icon: '/favicon.svg'
  },
  [NOTIFICATION_TYPES.ORDER_DELIVERED]: {
    title: '¡Tu pedido ha llegado! 📦',
    body: 'Tu pedido ha llegado a tu dirección. ¡Baja a recibirlo!',
    icon: '/favicon.svg'
  },
  [NOTIFICATION_TYPES.ORDER_COMPLETED]: {
    title: '¡Pedido Completado! ✅',
    body: 'Tu pedido ha sido completado exitosamente. ¡Gracias por tu compra!',
    icon: '/favicon.svg'
  },
  [NOTIFICATION_TYPES.PROMOTION]: {
    title: '¡Oferta Especial! 🎯',
    body: 'Tenemos una oferta especial para ti. ¡No te la pierdas!',
    icon: '/favicon.svg'
  },
  [NOTIFICATION_TYPES.GENERAL]: {
    title: 'Town App',
    body: 'Tienes una nueva notificación',
    icon: '/favicon.svg'
  }
} as const;







