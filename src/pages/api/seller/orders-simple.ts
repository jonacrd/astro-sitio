import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request }) => {
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
    
    // Verificar usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no autenticado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const sellerUuid = user.id;
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_cents,
        payment_method,
        transfer_proof,
        status,
        delivery_cents,
        created_at,
        delivery_address,
        delivery_notes,
        buyer:profiles!orders_user_id_fkey(
          name
        )
      `)
      .eq('seller_id', sellerUuid)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error obteniendo pedidos:', ordersError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo pedidos: ' + ordersError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener items de cada pedido
    const orderIds = orders?.map(order => order.id) || [];
    let orderItems = {};
    
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.log('⚠️ Error obteniendo items (tabla puede no existir):', itemsError.message);
        // Continuar sin items por ahora
      } else {
        // Agrupar items por order_id
        orderItems = items?.reduce((acc, item) => {
          if (!acc[item.order_id]) {
            acc[item.order_id] = [];
          }
          acc[item.order_id].push(item);
          return acc;
        }, {} as Record<string, any[]>) || {};
      }
    }

    // Formatear datos
    const formattedOrders = orders?.map(order => ({
      ...order,
      buyer_name: order.buyer?.name || 'Cliente',
      items: orderItems[order.id] || []
    })) || [];

    console.log('📋 Pedidos encontrados:', formattedOrders.length);
    formattedOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ID: ${order.id}, Total: $${order.total_cents}, Estado: ${order.status}`);
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders: formattedOrders
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/orders-simple:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};


