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
      // Primero intentar con JOIN
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products!order_items_product_id_fkey(
            title,
            price_cents
          )
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.log('⚠️ Error con JOIN, intentando método alternativo:', itemsError.message);
        
        // Método alternativo: obtener items y productos por separado
        const { data: itemsOnly, error: itemsOnlyError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsOnlyError) {
          console.log('⚠️ Error obteniendo items (tabla puede no existir):', itemsOnlyError.message);
          orderItems = {};
        } else {
          // Obtener todos los product_ids únicos
          const productIds = [...new Set(itemsOnly?.map(item => item.product_id).filter(Boolean))];
          
          // Obtener información de productos
          let productsMap = {};
          if (productIds.length > 0) {
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('id, title, price_cents')
              .in('id', productIds);

            if (productsError) {
              console.log('⚠️ Error obteniendo productos:', productsError.message);
            } else {
              productsMap = products?.reduce((acc, product) => {
                acc[product.id] = product;
                return acc;
              }, {} as Record<string, any>) || {};
            }
          }

          // Combinar items con información de productos
          orderItems = itemsOnly?.reduce((acc, item) => {
            if (!acc[item.order_id]) {
              acc[item.order_id] = [];
            }
            
            const product = productsMap[item.product_id];
            acc[item.order_id].push({
              ...item,
              title: product?.title || item.title || 'Producto',
              price_cents: product?.price_cents || item.price_cents || 0
            });
            return acc;
          }, {} as Record<string, any[]>) || {};
        }
      } else {
        // JOIN funcionó correctamente
        orderItems = items?.reduce((acc, item) => {
          if (!acc[item.order_id]) {
            acc[item.order_id] = [];
          }
          acc[item.order_id].push({
            ...item,
            title: item.product?.title || item.title || 'Producto',
            price_cents: item.product?.price_cents || item.price_cents || 0
          });
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
      if (order.items && order.items.length > 0) {
        console.log(`    Items:`, order.items.map(item => ({
          title: item.title,
          price_cents: item.price_cents,
          qty: item.qty || item.quantity
        })));
      }
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


