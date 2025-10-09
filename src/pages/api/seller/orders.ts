import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('🔍 /api/seller/orders: Iniciando request');
    
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
    console.log('🔍 /api/seller/orders: Auth header:', authHeader ? 'Presente' : 'Ausente');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ /api/seller/orders: No hay token de autorización');
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
      console.log('❌ /api/seller/orders: Error de autenticación:', authError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no autenticado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('✅ /api/seller/orders: Usuario autenticado:', user.id);

    // Verificar que el usuario es vendedor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_seller')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_seller) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para ver pedidos de vendedor'
      }), { 
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener pedidos del vendedor (solo columnas que existen)
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
        buyer:profiles!orders_user_id_fkey(
          name
        )
      `)
      .eq('seller_id', user.id)
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
        console.error('Error obteniendo items de pedidos:', itemsError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error obteniendo items de pedidos: ' + itemsError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }

      // Agrupar items por order_id
      orderItems = items?.reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push(item);
        return acc;
      }, {} as Record<string, any[]>) || {};
    }

    // Formatear datos
    const formattedOrders = orders?.map(order => ({
      ...order,
      items: orderItems[order.id] || []
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders: formattedOrders
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/orders:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
