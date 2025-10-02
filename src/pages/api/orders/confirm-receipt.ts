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

    // Usar service role key para bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no autenticado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener datos del request
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId es requerido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el pedido existe y pertenece al comprador
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (order.status !== 'delivered') {
      return new Response(JSON.stringify({
        success: false,
        error: 'El pedido debe estar entregado primero'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Actualizar estado del pedido
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        buyer_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

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

    // Crear notificación para el vendedor
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: order.seller_id,
        type: 'order_status',
        title: 'Pedido Completado',
        message: `El comprador ha confirmado la recepción del pedido #${orderId.substring(0, 8)}`,
        order_id: orderId
      });

    if (notificationError) {
      console.error('Error creando notificación:', notificationError);
      // No fallar por esto, solo loggear
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Recepción confirmada exitosamente'
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/orders/confirm-receipt:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};







