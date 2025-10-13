// Endpoint para que el courier actualice el status del delivery
import type { APIRoute } from 'astro';
import { sendWhatsAppAutomation } from '../../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { deliveryId, status, orderId, sellerId, customerId, courierPhone } = await request.json();
    
    console.log(`📦 COURIER: Actualizando status ${status} para delivery ${deliveryId}`);
    
    // 1. Actualizar estado en la base de datos
    // TODO: Implementar actualización en Supabase
    
    let sellerMessage = '';
    let customerMessage = '';
    
    switch (status) {
      case 'arrived_pickup':
        sellerMessage = `🚚 REPARTIDOR EN TU LOCAL\n\nID: ${deliveryId}\nEl repartidor llegó y está recogiendo el pedido.`;
        break;
        
      case 'picked_up':
        sellerMessage = `✅ PEDIDO RECOGIDO\n\nID: ${deliveryId}\nEl repartidor ya tiene el pedido.`;
        customerMessage = `🚗 TU PEDIDO VA EN CAMINO\n\nID: ${orderId}\nEl repartidor está en camino a tu dirección.\n\nDatos del repartidor:\nTeléfono: ${courierPhone}`;
        break;
        
      case 'arrived_delivery':
        customerMessage = `🚚 REPARTIDOR LLEGÓ\n\nID: ${orderId}\nEl repartidor está en tu dirección.\n\n¡Sal a recibir tu pedido!`;
        break;
        
      case 'delivered':
        sellerMessage = `✅ DELIVERY COMPLETADO\n\nID: ${deliveryId}\nEl pedido fue entregado exitosamente.`;
        customerMessage = `🎉 ¡PEDIDO ENTREGADO!\n\nID: ${orderId}\n¡Gracias por tu compra!`;
        break;
    }
    
    // 2. Enviar notificaciones según el status
    if (sellerMessage) {
      await sendWhatsAppAutomation('+56962614851', sellerMessage);
    }
    
    if (customerMessage) {
      await sendWhatsAppAutomation('+56962614851', customerMessage);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Status ${status} actualizado exitosamente`,
      deliveryId,
      status
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Error actualizando status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};





