// Estados del sistema de delivery
export const DELIVERY_STATES = {
  // Estados del pedido
  ORDER_PENDING: 'pending',
  ORDER_CONFIRMED: 'seller_confirmed', 
  ORDER_DELIVERY_REQUESTED: 'delivery_requested',
  ORDER_DELIVERY_ASSIGNED: 'delivery_assigned',
  ORDER_PICKED_UP: 'picked_up',
  ORDER_IN_TRANSIT: 'in_transit',
  ORDER_DELIVERED: 'delivered',
  ORDER_COMPLETED: 'completed',

  // Estados del delivery
  DELIVERY_AVAILABLE: 'available',
  DELIVERY_BUSY: 'busy',
  DELIVERY_OFFLINE: 'offline',
  
  // Estados de ofertas
  OFFER_PENDING: 'pending',
  OFFER_ACCEPTED: 'accepted',
  OFFER_EXPIRED: 'expired',
  OFFER_CANCELLED: 'cancelled'
} as const;

// Botones por estado
export const DELIVERY_BUTTONS = {
  [DELIVERY_STATES.ORDER_PENDING]: [
    { text: '✅ Confirmar Pedido', action: 'confirm_order', color: 'green' }
  ],
  [DELIVERY_STATES.ORDER_CONFIRMED]: [
    { text: '🚚 Solicitar Delivery', action: 'request_delivery', color: 'orange' },
    { text: '📦 Marcar Entregado', action: 'mark_delivered', color: 'blue' }
  ],
  [DELIVERY_STATES.ORDER_DELIVERY_REQUESTED]: [
    { text: '⏳ Esperando Delivery...', action: 'waiting', color: 'gray', disabled: true }
  ],
  [DELIVERY_STATES.ORDER_DELIVERY_ASSIGNED]: [
    { text: '📦 Confirmar Recogida', action: 'confirm_pickup', color: 'blue' }
  ],
  [DELIVERY_STATES.ORDER_PICKED_UP]: [
    { text: '🚚 En Camino', action: 'start_delivery', color: 'orange' }
  ],
  [DELIVERY_STATES.ORDER_IN_TRANSIT]: [
    { text: '🎉 Marcar Entregado', action: 'mark_delivered', color: 'purple' }
  ],
  [DELIVERY_STATES.ORDER_DELIVERED]: [
    { text: '✅ Completar Pedido', action: 'complete_order', color: 'green' }
  ]
} as const;

// Botones del delivery por estado
export const COURIER_BUTTONS = {
  [DELIVERY_STATES.DELIVERY_AVAILABLE]: [
    { text: '🟢 Disponible', action: 'set_available', color: 'green' },
    { text: '🔴 No Disponible', action: 'set_busy', color: 'red' }
  ],
  [DELIVERY_STATES.DELIVERY_BUSY]: [
    { text: '🟢 Disponible', action: 'set_available', color: 'green' },
    { text: '🔴 No Disponible', action: 'set_busy', color: 'red' }
  ],
  [DELIVERY_STATES.OFFER_PENDING]: [
    { text: '✅ Aceptar Pedido', action: 'accept_offer', color: 'green' }
  ],
  [DELIVERY_STATES.OFFER_ACCEPTED]: [
    { text: '📦 Confirmar Recogida', action: 'confirm_pickup', color: 'blue' }
  ],
  [DELIVERY_STATES.ORDER_PICKED_UP]: [
    { text: '🚚 En Camino', action: 'start_delivery', color: 'orange' }
  ],
  [DELIVERY_STATES.ORDER_IN_TRANSIT]: [
    { text: '🎉 Marcar Entregado', action: 'mark_delivered', color: 'purple' }
  ]
} as const;





