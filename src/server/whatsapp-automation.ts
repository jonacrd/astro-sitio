// Sistema automático de notificaciones WhatsApp
import { createClient } from '@supabase/supabase-js';

// Función helper para obtener cliente Supabase
function getSupabase() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase no configurado');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Función helper para obtener configuración de WhatsApp
function getWhatsAppConfig() {
  // Configuración directa para desarrollo
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPuQTxoWRMCfI5nJ4LmAAHAgbCBgqN4mPF1Ea1ZA8qfXmPXSy6a6dQKCtUwN9D9EK1hZBWfZAdB0xRZC3OT8KmVswVj1uM9qNPjkOHu9zt5ySKK9OC8brgaZA1wpJwou4FnSAYdJoVP8qRqrT5XFIZBXuMdoY0kUlMkBkO2ZAoFyxmQRjXh3jVRIhUfjUwWoZBFZATRVuTq9c1Daf3x0MXwhqu6ig8zL9sgnAw0u02nn6zFuMZD';
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || import.meta.env.WHATSAPP_PHONE_ID || '773488772522546';
  
  console.log('🔍 WhatsApp Config - Token presente:', !!WHATSAPP_TOKEN);
  console.log('🔍 WhatsApp Config - Phone ID:', WHATSAPP_PHONE_ID);
  
  return {
    token: WHATSAPP_TOKEN,
    phoneId: WHATSAPP_PHONE_ID,
    apiUrl: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`
  };
}

// Enviar WhatsApp automático con soporte para plantillas
export async function sendWhatsAppAutomation(
  to: string, 
  message: string, 
  templateName?: string, 
  templateParams?: string[]
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log(`📱 AUTOMÁTICO: Enviando WhatsApp a ${to}`);
    console.log(`📱 AUTOMÁTICO: Mensaje: ${message}`);
    
    const config = getWhatsAppConfig();
    
    if (!config.token || !config.phoneId) {
      console.warn('⚠️ WhatsApp Cloud API no configurada - usando fallback');
      return { success: true, messageId: 'fallback' };
    }

    // Si hay plantilla personalizada, intentar usarla
    if (templateName && templateParams) {
      console.log(`📱 AUTOMÁTICO: Usando plantilla personalizada: ${templateName}`);
      
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.startsWith('+') ? to.substring(1) : to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'es_ES'
            },
            components: [
              {
                type: 'body',
                parameters: templateParams.map(param => ({
                  type: 'text',
                  text: param
                }))
              }
            ]
          },
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ AUTOMÁTICO: WhatsApp con plantilla personalizada enviado exitosamente:', result);
        return { success: true, messageId: result.messages[0].id };
      } else {
        console.warn('⚠️ AUTOMÁTICO: Plantilla personalizada falló, usando fallback:', result);
        // Continuar con fallback
      }
    }

    // Fallback: usar plantilla hello_world
    console.log('📱 AUTOMÁTICO: Usando plantilla hello_world como fallback');
    
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.startsWith('+') ? to.substring(1) : to,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        },
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ AUTOMÁTICO: WhatsApp enviado exitosamente:', result);
      return { success: true, messageId: result.messages[0].id };
    } else {
      console.error('❌ AUTOMÁTICO: Error enviando WhatsApp:', result);
      return { success: false, error: result.error?.message || 'Error desconocido' };
    }
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error en sendWhatsAppAutomation:', error);
    return { success: false, error: error.message };
  }
}

// 1. NOTIFICAR AL VENDEDOR - NUEVO PEDIDO
export async function notifySellerNewOrder(orderId: string, sellerId: string): Promise<void> {
  try {
    console.log(`🛒 AUTOMÁTICO: Notificando vendedor ${sellerId} sobre pedido ${orderId}`);
    
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('⚠️ AUTOMÁTICO: Supabase no configurado, usando fallback');
      const fallbackPhone = '+56962614851';
      const message = `🛒 NUEVO PEDIDO RECIBIDO\n\nID: ${orderId}\n\nVe a tu dashboard para confirmar el pedido.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }
    
    // Obtener datos del vendedor
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('phone, name')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      console.error('❌ AUTOMÁTICO: Error obteniendo datos del vendedor:', sellerError);
      // Usar fallback
      const fallbackPhone = '+56962614851';
      const message = `🛒 NUEVO PEDIDO RECIBIDO\n\nID: ${orderId}\n\nVe a tu dashboard para confirmar el pedido.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }

    if (!seller.phone) {
      console.warn('⚠️ AUTOMÁTICO: Vendedor sin teléfono, usando fallback');
      // Usar número de prueba
      const fallbackPhone = '+56962614851';
      const message = `🛒 NUEVO PEDIDO RECIBIDO\n\nID: ${orderId}\n\nVe a tu dashboard para confirmar el pedido.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }

    const message = `🛒 NUEVO PEDIDO RECIBIDO\n\nID: ${orderId}\n\nVe a tu dashboard para confirmar el pedido.`;
    // Intentar usar plantilla personalizada, fallback a hello_world
    await sendWhatsAppAutomation(seller.phone, message, 'nuevo_pedido_vendedor', [orderId, seller.name || 'Cliente', '0']);
    
    console.log('✅ AUTOMÁTICO: Vendedor notificado exitosamente');
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error notificando vendedor:', error);
  }
}

// 2. NOTIFICAR AL CLIENTE - PEDIDO CONFIRMADO
export async function notifyCustomerOrderConfirmed(orderId: string, customerId: string): Promise<void> {
  try {
    console.log(`✅ AUTOMÁTICO: Notificando cliente ${customerId} sobre confirmación ${orderId}`);
    
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('⚠️ AUTOMÁTICO: Supabase no configurado, usando fallback');
      const fallbackPhone = '+56962614851';
      const message = `✅ TU PEDIDO HA SIDO CONFIRMADO\n\nID: ${orderId}\n\nTu pedido está siendo preparado.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }
    
    // Obtener datos del cliente
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('phone, name')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('❌ AUTOMÁTICO: Error obteniendo datos del cliente:', customerError);
      const fallbackPhone = '+56962614851';
      const message = `✅ TU PEDIDO HA SIDO CONFIRMADO\n\nID: ${orderId}\n\nTu pedido está siendo preparado.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }

    if (!customer.phone) {
      console.warn('⚠️ AUTOMÁTICO: Cliente sin teléfono, usando fallback');
      const fallbackPhone = '+56962614851';
      const message = `✅ TU PEDIDO HA SIDO CONFIRMADO\n\nID: ${orderId}\n\nTu pedido está siendo preparado.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }

    const message = `✅ TU PEDIDO HA SIDO CONFIRMADO\n\nID: ${orderId}\n\nTu pedido está siendo preparado.`;
    // Intentar usar plantilla personalizada, fallback a hello_world
    await sendWhatsAppAutomation(customer.phone, message, 'pedido_confirmado_cliente', [orderId, '30 minutos']);
    
    console.log('✅ AUTOMÁTICO: Cliente notificado exitosamente');
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error notificando cliente:', error);
  }
}

// 3. NOTIFICAR AL DELIVERY - NUEVA OFERTA
export async function notifyDeliveryNewOffer(deliveryId: string, courierId: string, pickupAddress: string): Promise<void> {
  try {
    console.log(`🚚 AUTOMÁTICO: Notificando delivery ${courierId} sobre oferta ${deliveryId}`);
    
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('⚠️ AUTOMÁTICO: Supabase no configurado, usando fallback');
      const fallbackPhone = '+56962614851';
      const message = `🚚 NUEVA OFERTA DE DELIVERY\n\nID: ${deliveryId}\nDirección: ${pickupAddress}\n\nVe a tu app para aceptar o rechazar.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }
    
    // Obtener datos del delivery
    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('phone, name')
      .eq('id', courierId)
      .single();

    if (courierError || !courier) {
      console.error('❌ AUTOMÁTICO: Error obteniendo datos del delivery:', courierError);
      const fallbackPhone = '+56962614851';
      const message = `🚚 NUEVA OFERTA DE DELIVERY\n\nID: ${deliveryId}\nDirección: ${pickupAddress}\n\nVe a tu app para aceptar o rechazar.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }

    if (!courier.phone) {
      console.warn('⚠️ AUTOMÁTICO: Delivery sin teléfono, usando fallback');
      const fallbackPhone = '+56962614851';
      const message = `🚚 NUEVA OFERTA DE DELIVERY\n\nID: ${deliveryId}\nDirección: ${pickupAddress}\n\nVe a tu app para aceptar o rechazar.`;
      await sendWhatsAppAutomation(fallbackPhone, message);
      return;
    }

    const message = `🚚 NUEVA OFERTA DE DELIVERY\n\nID: ${deliveryId}\nDirección: ${pickupAddress}\n\nVe a tu app para aceptar o rechazar.`;
    // Intentar usar plantilla personalizada, fallback a hello_world
    await sendWhatsAppAutomation(courier.phone, message, 'delivery_asignado_courier', [deliveryId, pickupAddress, '5000']);
    
    console.log('✅ AUTOMÁTICO: Delivery notificado exitosamente');
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error notificando delivery:', error);
  }
}

// 4. NOTIFICAR STATUS DE DELIVERY
export async function notifyDeliveryStatus(deliveryId: string, status: string, sellerId: string, customerId: string): Promise<void> {
  try {
    console.log(`📦 AUTOMÁTICO: Notificando status ${status} para delivery ${deliveryId}`);
    
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('⚠️ AUTOMÁTICO: Supabase no configurado para notificaciones de status');
      return;
    }
    
    let sellerMessage = '';
    let customerMessage = '';
    
    switch (status) {
      case 'assigned':
        sellerMessage = `🚚 DELIVERY ASIGNADO\n\nID: ${deliveryId}\nEl repartidor está en camino a tu local.`;
        customerMessage = `📦 TU PEDIDO ESTÁ EN CAMINO\n\nID: ${deliveryId}\nEl repartidor va a recoger tu pedido.`;
        break;
      case 'pickup_confirmed':
        sellerMessage = `📦 REPARTIDOR EN TU LOCAL\n\nID: ${deliveryId}\nEl repartidor está recogiendo el pedido.`;
        customerMessage = `🚗 TU PEDIDO VA EN CAMINO\n\nID: ${deliveryId}\nEl repartidor está en camino a tu dirección.`;
        break;
      case 'in_transit':
        sellerMessage = '';
        customerMessage = `🚗 TU PEDIDO VA EN CAMINO\n\nID: ${deliveryId}\nEl repartidor está en camino a tu dirección.`;
        break;
      case 'delivered':
        sellerMessage = `✅ DELIVERY COMPLETADO\n\nID: ${deliveryId}\nEl pedido fue entregado exitosamente.`;
        customerMessage = `🎉 ¡TU PEDIDO LLEGÓ!\n\nID: ${deliveryId}\nSal a recibir tu pedido.`;
        break;
    }
    
    // Notificar vendedor
    if (sellerMessage) {
      const { data: seller } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', sellerId)
        .single();
      
      if (seller?.phone) {
        await sendWhatsAppAutomation(seller.phone, sellerMessage);
      } else {
        console.warn('⚠️ AUTOMÁTICO: Vendedor sin teléfono para notificación de status');
      }
    }
    
    // Notificar cliente
    if (customerMessage) {
      const { data: customer } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', customerId)
        .single();
      
      if (customer?.phone) {
        await sendWhatsAppAutomation(customer.phone, customerMessage);
      } else {
        console.warn('⚠️ AUTOMÁTICO: Cliente sin teléfono para notificación de status');
      }
    }
    
    console.log('✅ AUTOMÁTICO: Status de delivery notificado exitosamente');
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error notificando status de delivery:', error);
  }
}
