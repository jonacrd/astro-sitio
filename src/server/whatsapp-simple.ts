// WhatsApp simple para pruebas sin plantillas

// Enviar mensaje simple sin plantillas
export async function sendSimpleWhatsApp(to: string, message: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`📱 Enviando WhatsApp a ${to}: ${message}`);
    
    // Por ahora solo logueamos, en producción se enviaría realmente
    console.log('✅ WhatsApp enviado (simulado)');
    
    // Por ahora solo logueamos, no guardamos en BD

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error enviando WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

// Notificar al vendedor sobre nuevo pedido
export async function notifySellerNewOrder(sellerPhone: string, orderId: string): Promise<void> {
  const message = `🛒 NUEVO PEDIDO RECIBIDO\n\nID: ${orderId}\n\nVe a tu dashboard para confirmar el pedido.`;
  await sendSimpleWhatsApp(sellerPhone, message);
}

// Notificar al repartidor sobre nueva oferta
export async function notifyCourierNewOffer(courierPhone: string, deliveryId: string, pickupAddress: string): Promise<void> {
  const message = `🚚 NUEVA OFERTA DE DELIVERY\n\nID: ${deliveryId}\nDirección: ${pickupAddress}\n\nVe a tu app para aceptar o rechazar.`;
  await sendSimpleWhatsApp(courierPhone, message);
}

// Notificar confirmación de delivery
export async function notifyDeliveryConfirmed(sellerPhone: string, buyerPhone: string, deliveryId: string): Promise<void> {
  const sellerMessage = `✅ DELIVERY CONFIRMADO\n\nID: ${deliveryId}\nEl repartidor está en camino a tu local.`;
  const buyerMessage = `📦 TU PEDIDO ESTÁ EN CAMINO\n\nID: ${deliveryId}\nEl repartidor va a recoger tu pedido.`;
  
  await sendSimpleWhatsApp(sellerPhone, sellerMessage);
  await sendSimpleWhatsApp(buyerPhone, buyerMessage);
}

// Notificar que el repartidor llegó al local
export async function notifyPickupConfirmed(sellerPhone: string, buyerPhone: string, deliveryId: string): Promise<void> {
  const sellerMessage = `📦 REPARTIDOR EN TU LOCAL\n\nID: ${deliveryId}\nEl repartidor está recogiendo el pedido.`;
  const buyerMessage = `🚗 TU PEDIDO VA EN CAMINO\n\nID: ${deliveryId}\nEl repartidor está en camino a tu dirección.`;
  
  await sendSimpleWhatsApp(sellerPhone, sellerMessage);
  await sendSimpleWhatsApp(buyerPhone, buyerMessage);
}

// Notificar entrega completada
export async function notifyDeliveryCompleted(sellerPhone: string, buyerPhone: string, deliveryId: string): Promise<void> {
  const sellerMessage = `✅ DELIVERY COMPLETADO\n\nID: ${deliveryId}\nEl pedido fue entregado exitosamente.`;
  const buyerMessage = `🎉 ¡TU PEDIDO LLEGÓ!\n\nID: ${deliveryId}\nSal a recibir tu pedido.`;
  
  await sendSimpleWhatsApp(sellerPhone, sellerMessage);
  await sendSimpleWhatsApp(buyerPhone, buyerMessage);
}
