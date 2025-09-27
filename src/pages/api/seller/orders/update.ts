import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId y status son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`🔄 Actualizando pedido ${orderId} a estado: ${status}`);

    // Actualizar el estado del pedido
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando pedido:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando pedido: ' + updateError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('✅ Pedido actualizado:', updatedOrder);

    // Crear notificación para el comprador
    const notificationTitle = getNotificationTitle(status);
    const notificationMessage = getNotificationMessage(status, orderId);

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: updatedOrder.user_id,
        type: 'order_confirmed',
        title: notificationTitle,
        message: notificationMessage,
        order_id: orderId,
        is_read: false
      });

    if (notificationError) {
      console.log('⚠️ Error creando notificación (tabla puede no existir):', notificationError.message);
      // Continuar sin notificación por ahora
    } else {
      console.log('🔔 Notificación creada para el comprador');
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        order: updatedOrder,
        message: `Pedido actualizado a ${status}`
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/orders/update:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

function getNotificationTitle(status: string): string {
  switch (status) {
    case 'confirmed':
      return '¡Pedido Confirmado!';
    case 'delivered':
      return '¡Pedido Entregado!';
    case 'completed':
      return '¡Pedido Completado!';
    default:
      return 'Estado del Pedido Actualizado';
  }
}

function getNotificationMessage(status: string, orderId: string): string {
  const orderCode = orderId.substring(0, 8);
  
  switch (status) {
    case 'confirmed':
      return `Tu pedido #${orderCode} ha sido confirmado por el vendedor. ¡Pronto será preparado!`;
    case 'delivered':
      return `¡Excelente! Tu pedido #${orderCode} ha sido entregado. ¡Esperamos que lo disfrutes!`;
    case 'completed':
      return `Tu pedido #${orderCode} ha sido completado. ¡Gracias por tu compra!`;
    default:
      return `El estado de tu pedido #${orderCode} ha sido actualizado a ${status}.`;
  }
}