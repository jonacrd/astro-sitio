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

    // Verificar que el pedido pertenece al vendedor
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, seller_id, status')
      .eq('id', orderId)
      .eq('seller_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido no encontrado o no tienes permisos'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Validar transición de estado
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['delivered', 'cancelled'],
      'delivered': ['completed'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[order.status as keyof typeof validTransitions]?.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `No se puede cambiar de ${order.status} a ${status}`
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Actualizar estado del pedido
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Agregar timestamp de confirmación del vendedor
    if (status === 'confirmed') {
      updateData.seller_confirmed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
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

    // Si se marca como entregado, reducir stock
    if (status === 'delivered') {
      // Obtener items del pedido
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, qty')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error obteniendo items del pedido:', itemsError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error obteniendo items del pedido: ' + itemsError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }

      // Reducir stock de cada producto
      for (const item of orderItems || []) {
        const { error: stockError } = await supabase
          .from('seller_products')
          .update({ 
            stock: supabase.raw(`stock - ${item.qty}`),
            updated_at: new Date().toISOString()
          })
          .eq('seller_id', user.id)
          .eq('product_id', item.product_id);

        if (stockError) {
          console.error('Error actualizando stock:', stockError);
          // No fallar la operación por esto, solo logear
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        orderId,
        status,
        message: `Pedido ${status === 'confirmed' ? 'confirmado' : status === 'delivered' ? 'marcado como entregado' : 'actualizado'} exitosamente`
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
