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

    const customerUuid = user.id;
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total_cents,
        status,
        payment_method,
        created_at,
        updated_at,
        delivery_address,
        delivery_notes,
        seller:profiles!orders_seller_id_fkey(
          id,
          name,
          phone
        )
      `)
      .eq('user_id', customerUuid)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error obteniendo órdenes del comprador:', ordersError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo órdenes: ' + ordersError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`✅ Órdenes del comprador encontradas: ${orders?.length || 0}`);

    // Obtener items de las órdenes
    const orderIds = orders?.map(order => order.id) || [];
    let orderItems: any[] = [];
    
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          order_id,
          product_title,
          price_cents,
          quantity,
          seller_name
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.log('⚠️ No se pudieron obtener items de órdenes:', itemsError.message);
      } else {
        orderItems = items || [];
      }
    }

    // Combinar órdenes con sus items
    const ordersWithItems = orders?.map(order => ({
      ...order,
      items: orderItems.filter(item => item.order_id === order.id)
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders: ordersWithItems,
        total: ordersWithItems.length
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en endpoint de órdenes del comprador:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
