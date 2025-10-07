// WhatsApp Web automático - no requiere API de Meta
import { createClient } from '@supabase/supabase-js';

// Enviar WhatsApp usando Web API (sin Meta Cloud API)
export async function sendWhatsAppWebAuto(to: string, message: string): Promise<{
  success: boolean;
  error?: string;
  whatsappUrl?: string;
}> {
  try {
    console.log(`📱 Generando WhatsApp Web automático para ${to}: ${message}`);
    
    // Crear URL de WhatsApp Web
    const cleanPhone = to.replace(/[^\d]/g, ''); // Solo números
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    console.log('🔗 URL de WhatsApp generada:', whatsappUrl);
    
    // Guardar en base de datos para procesamiento posterior
    await saveWhatsAppMessage(to, message, whatsappUrl);
    
    return { 
      success: true, 
      whatsappUrl: whatsappUrl
    };
  } catch (error: any) {
    console.error('❌ Error generando WhatsApp Web:', error);
    return { success: false, error: error.message };
  }
}

// Guardar mensaje en base de datos para procesamiento
async function saveWhatsAppMessage(phone: string, message: string, url: string): Promise<void> {
  try {
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('📱 Supabase no configurado - solo logueando WhatsApp');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Crear tabla si no existe
    await supabase.rpc('create_whatsapp_logs_table');
    
    // Insertar mensaje
    const { error } = await supabase
      .from('whatsapp_logs')
      .insert({
        phone,
        message,
        url,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error guardando WhatsApp log:', error);
    } else {
      console.log('✅ WhatsApp log guardado en BD');
    }
  } catch (error) {
    console.error('❌ Error en saveWhatsAppMessage:', error);
  }
}

// Notificar al vendedor sobre nuevo pedido
export async function notifySellerNewOrder(sellerPhone: string, orderId: string): Promise<void> {
  const message = `🛒 NUEVO PEDIDO RECIBIDO\n\nID: ${orderId}\n\nVe a tu dashboard para confirmar el pedido.`;
  await sendWhatsAppWebAuto(sellerPhone, message);
}

// Notificar al repartidor sobre nueva oferta
export async function notifyCourierNewOffer(courierPhone: string, deliveryId: string, pickupAddress: string): Promise<void> {
  const message = `🚚 NUEVA OFERTA DE DELIVERY\n\nID: ${deliveryId}\nDirección: ${pickupAddress}\n\nVe a tu app para aceptar o rechazar.`;
  await sendWhatsAppWebAuto(courierPhone, message);
}

// Notificar confirmación de delivery
export async function notifyDeliveryConfirmed(sellerPhone: string, buyerPhone: string, deliveryId: string): Promise<void> {
  const sellerMessage = `✅ DELIVERY CONFIRMADO\n\nID: ${deliveryId}\nEl repartidor está en camino a tu local.`;
  const buyerMessage = `📦 TU PEDIDO ESTÁ EN CAMINO\n\nID: ${deliveryId}\nEl repartidor va a recoger tu pedido.`;
  
  await sendWhatsAppWebAuto(sellerPhone, sellerMessage);
  await sendWhatsAppWebAuto(buyerPhone, buyerMessage);
}

// Notificar que el repartidor llegó al local
export async function notifyPickupConfirmed(sellerPhone: string, buyerPhone: string, deliveryId: string): Promise<void> {
  const sellerMessage = `📦 REPARTIDOR EN TU LOCAL\n\nID: ${deliveryId}\nEl repartidor está recogiendo el pedido.`;
  const buyerMessage = `🚗 TU PEDIDO VA EN CAMINO\n\nID: ${deliveryId}\nEl repartidor está en camino a tu dirección.`;
  
  await sendWhatsAppWebAuto(sellerPhone, sellerMessage);
  await sendWhatsAppWebAuto(buyerPhone, buyerMessage);
}

// Notificar que el pedido va en camino
export async function notifyDeliveryOnTheWay(buyerPhone: string, deliveryId: string): Promise<void> {
  const message = `🚗 TU PEDIDO VA EN CAMINO\n\nID: ${deliveryId}\nEl repartidor está en camino a tu dirección.`;
  await sendWhatsAppWebAuto(buyerPhone, message);
}

// Notificar entrega completada
export async function notifyDeliveryCompleted(sellerPhone: string, buyerPhone: string, deliveryId: string): Promise<void> {
  const sellerMessage = `✅ DELIVERY COMPLETADO\n\nID: ${deliveryId}\nEl pedido fue entregado exitosamente.`;
  const buyerMessage = `🎉 ¡TU PEDIDO LLEGÓ!\n\nID: ${deliveryId}\nSal a recibir tu pedido.`;
  
  await sendWhatsAppWebAuto(sellerPhone, sellerMessage);
  await sendWhatsAppWebAuto(buyerPhone, buyerMessage);
}
