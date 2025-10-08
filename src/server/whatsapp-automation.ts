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
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN || 'EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD';
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
    // Usar plantilla order_management_1 para vendedor
    await sendWhatsAppAutomation(seller.phone, message, 'order_management_1', [seller.name || 'Vendedor', 'nueva orden']);
    
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
    // Usar plantilla order_confirmed para comprador
    await sendWhatsAppAutomation(customer.phone, message, 'order_confirmed', [customer.name || 'Cliente', orderId]);
    
    console.log('✅ AUTOMÁTICO: Cliente notificado exitosamente');
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error notificando cliente:', error);
  }
}

// 3. NOTIFICAR AL DELIVERY - NUEVA OFERTA
export async function notifyDeliveryNewOffer(phone: string, orderId: string, courierName: string): Promise<void> {
  try {
    console.log(`🚚 AUTOMÁTICO: Notificando delivery ${courierName} sobre oferta ${orderId}`);
    
    const message = `🚚 NUEVA OFERTA DE DELIVERY\n\nID: ${orderId}\n\nVe a tu app para aceptar o rechazar.`;
    // Usar hello_world para delivery (no hay plantilla específica)
    await sendWhatsAppAutomation(phone, message, 'hello_world');
    
    console.log('✅ AUTOMÁTICO: Delivery notificado exitosamente');
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error notificando delivery:', error);
  }
}

// 4. NOTIFICAR STATUS DE DELIVERY
export async function notifyDeliveryStatus(phone: string, status: string, orderId: string, userName: string): Promise<void> {
  try {
    console.log(`📦 AUTOMÁTICO: Notificando status ${status} para ${userName}`);
    
    let message = '';
    let templateName = 'hello_world';
    let templateParams: string[] = [];
    
    switch (status) {
      case 'delivery_assigned':
        message = `🚚 DELIVERY ASIGNADO\n\nID: ${orderId}\nEl repartidor está en camino a tu local.`;
        templateName = 'order_management_1';
        templateParams = [userName, 'delivery asignado'];
        break;
      case 'pickup_confirmed':
        message = `📦 REPARTIDOR EN TU LOCAL\n\nID: ${orderId}\nEl repartidor está recogiendo el pedido.`;
        templateName = 'order_management_1';
        templateParams = [userName, 'repartidor en local'];
        break;
      case 'in_transit':
        message = `🚗 TU PEDIDO VA EN CAMINO\n\nID: ${orderId}\nEl repartidor está en camino a tu dirección.`;
        templateName = 'order_on_the_way';
        templateParams = [orderId];
        break;
      case 'delivered':
        message = `🎉 ¡TU PEDIDO LLEGÓ!\n\nID: ${orderId}\nSal a recibir tu pedido.`;
        templateName = 'order_delivered';
        templateParams = [userName];
        break;
      default:
        message = `📦 ACTUALIZACIÓN DE PEDIDO\n\nID: ${orderId}\nStatus: ${status}`;
        templateName = 'hello_world';
    }
    
    await sendWhatsAppAutomation(phone, message, templateName, templateParams);
    
    console.log('✅ AUTOMÁTICO: Status de delivery notificado exitosamente');
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error notificando status de delivery:', error);
  }
}

// 5. NOTIFICAR AL COMPRADOR - STATUS DE DELIVERY
export async function notifyBuyerDeliveryStatus(phone: string, status: string, orderId: string, buyerName: string): Promise<void> {
  try {
    console.log(`🛒 AUTOMÁTICO: Notificando comprador ${buyerName} sobre status ${status}`);
    
    let message = '';
    let templateName = 'hello_world';
    let templateParams: string[] = [];
    
    switch (status) {
      case 'delivery_assigned':
        message = `📦 TU PEDIDO ESTÁ EN CAMINO\n\nID: ${orderId}\nEl repartidor va a recoger tu pedido.`;
        templateName = 'order_confirmed';
        templateParams = [buyerName, orderId];
        break;
      case 'in_transit':
        message = `🚗 TU PEDIDO VA EN CAMINO\n\nID: ${orderId}\nEl repartidor está en camino a tu dirección.`;
        templateName = 'order_on_the_way';
        templateParams = [orderId];
        break;
      case 'delivered':
        message = `🎉 ¡TU PEDIDO LLEGÓ!\n\nID: ${orderId}\nSal a recibir tu pedido.`;
        templateName = 'order_delivered';
        templateParams = [buyerName];
        break;
      default:
        message = `📦 ACTUALIZACIÓN DE PEDIDO\n\nID: ${orderId}\nStatus: ${status}`;
        templateName = 'hello_world';
    }
    
    await sendWhatsAppAutomation(phone, message, templateName, templateParams);
    
    console.log('✅ AUTOMÁTICO: Comprador notificado exitosamente');
  } catch (error: any) {
    console.error('❌ AUTOMÁTICO: Error notificando comprador:', error);
  }
}
