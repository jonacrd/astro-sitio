import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { orderId, newStatus, userType } = body;

    console.log('🔄 Actualizando estado de orden:', { orderId, newStatus, userType });

    if (!orderId || !newStatus) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de orden y nuevo estado son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

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

    // Actualizar el estado de la orden
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando orden:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando orden: ' + updateError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('✅ Orden actualizada:', updatedOrder);

    // Crear notificación para el usuario correspondiente
    const notificationData = {
      user_id: userType === 'seller' ? updatedOrder.user_id : updatedOrder.seller_id,
      type: 'order_status_update',
      title: `Estado de orden actualizado`,
      message: `Tu orden #${orderId} ahora está en estado: ${newStatus}`,
      data: {
        orderId: orderId,
        newStatus: newStatus,
        updatedAt: new Date().toISOString()
      }
    };

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData);

    if (notificationError) {
      console.log('⚠️ No se pudo crear notificación:', notificationError.message);
    } else {
      console.log('✅ Notificación creada');
    }

    // Disparar evento de notificación en el cliente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('order-status-updated', {
        detail: {
          orderId: orderId,
          newStatus: newStatus,
          updatedAt: new Date().toISOString()
        }
      }));
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        order: updatedOrder,
        message: 'Estado de orden actualizado correctamente'
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en endpoint de actualización de estado:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
