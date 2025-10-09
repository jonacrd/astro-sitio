// Stubs de notificaciones WhatsApp (placeholder para futura integración)
import type { Courier, Delivery, DeliveryOffer } from '../types';

// Notificar oferta a courier
export async function notifyCourierOffer(courier: Courier, offer: DeliveryOffer): Promise<void> {
  console.info(`📱 [WHATSAPP STUB] Oferta enviada a ${courier.name} (${courier.phone})`);
  console.info(`   Pedido: ${offer.deliveryId}`);
  console.info(`   Expira: ${offer.expiresAt.toISOString()}`);
  
  // TODO: Integrar con WhatsApp Cloud API
  // await sendWhatsAppMessage({
  //   to: courier.phone,
  //   template: 'delivery_offer',
  //   components: [
  //     { type: 'text', text: offer.deliveryId },
  //     { type: 'text', text: delivery.pickup.address },
  //     { type: 'text', text: delivery.dropoff.address }
  //   ]
  // });
}

// Notificar asignación al cliente
export async function notifyCustomerAssigned(delivery: Delivery, courier: Courier): Promise<void> {
  console.info(`📱 [WHATSAPP STUB] Cliente notificado: ${courier.name} tomó el pedido`);
  console.info(`   Pedido: ${delivery.id}`);
  console.info(`   Repartidor: ${courier.name} (${courier.phone})`);
  
  // TODO: Integrar con WhatsApp Cloud API
  // await sendWhatsAppMessage({
  //   to: customerPhone,
  //   template: 'delivery_assigned',
  //   components: [
  //     { type: 'text', text: courier.name },
  //     { type: 'text', text: trackingUrl }
  //   ]
  // });
}

// Notificar al vendedor que no hay courier
export async function notifyVendorNoCourier(delivery: Delivery): Promise<void> {
  console.info(`📱 [WHATSAPP STUB] Vendedor notificado: Sin repartidor disponible`);
  console.info(`   Pedido: ${delivery.id}`);
  console.info(`   Vendedor: ${delivery.sellerId}`);
  
  // TODO: Integrar con WhatsApp Cloud API
  // await sendWhatsAppMessage({
  //   to: vendorPhone,
  //   template: 'no_courier_available',
  //   components: [
  //     { type: 'text', text: delivery.id }
  //   ]
  // });
}

// Notificar cambio de estado al cliente
export async function notifyCustomerStatusUpdate(delivery: Delivery, courier: Courier): Promise<void> {
  console.info(`📱 [WHATSAPP STUB] Cliente notificado: Estado actualizado a ${delivery.status}`);
  console.info(`   Pedido: ${delivery.id}`);
  console.info(`   Estado: ${delivery.status}`);
  
  // TODO: Integrar con WhatsApp Cloud API
  // await sendWhatsAppMessage({
  //   to: customerPhone,
  //   template: 'delivery_status_update',
  //   components: [
  //     { type: 'text', text: delivery.id },
  //     { type: 'text', text: delivery.status },
  //     { type: 'text', text: courier.name }
  //   ]
  // });
}

// Notificar entrega completada
export async function notifyDeliveryCompleted(delivery: Delivery, courier: Courier): Promise<void> {
  console.info(`📱 [WHATSAPP STUB] Cliente notificado: Pedido entregado`);
  console.info(`   Pedido: ${delivery.id}`);
  console.info(`   Repartidor: ${courier.name}`);
  
  // TODO: Integrar con WhatsApp Cloud API
  // await sendWhatsAppMessage({
  //   to: customerPhone,
  //   template: 'delivery_completed',
  //   components: [
  //     { type: 'text', text: delivery.id },
  //     { type: 'text', text: courier.name },
  //     { type: 'text', text: ratingUrl }
  //   ]
  // });
}

