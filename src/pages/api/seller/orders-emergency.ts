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
    
    console.log('🚨 MODO EMERGENCIA: Obteniendo pedidos sin JOIN complejo...');
    
    // 1. Obtener pedidos básicos
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
        delivery_notes
      `)
      .eq('seller_id', sellerUuid)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo pedidos: ' + ordersError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 2. Obtener información del comprador por separado
    const userIds = [...new Set(orders?.map(order => order.user_id).filter(Boolean))];
    let buyersMap = {};
    
    if (userIds.length > 0) {
      const { data: buyers, error: buyersError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      
      if (!buyersError && buyers) {
        buyersMap = buyers.reduce((acc, buyer) => {
          acc[buyer.id] = buyer;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // 3. Obtener items de pedidos de forma simple
    const orderIds = orders?.map(order => order.id) || [];
    let orderItems = {};
    
    if (orderIds.length > 0) {
      console.log('🔍 Obteniendo items para', orderIds.length, 'pedidos...');
      
      // Intentar obtener items de la forma más simple posible
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.log('❌ Error obteniendo items:', itemsError.message);
        // Si no podemos obtener items, crear items vacíos
        orderItems = {};
      } else {
        console.log('✅ Items obtenidos:', items?.length || 0);
        
        if (items && items.length > 0) {
          // Obtener todos los product_ids únicos
          const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];
          console.log('🔍 Product IDs únicos encontrados:', productIds);
          
          // Obtener todos los productos de una vez
          let productsMap = {};
          if (productIds.length > 0) {
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('id, title')
              .in('id', productIds);
            
            if (productsError) {
              console.log('⚠️ Error obteniendo productos:', productsError.message);
            } else {
              console.log('✅ Productos obtenidos:', products?.length || 0);
              productsMap = products?.reduce((acc, product) => {
                acc[product.id] = product;
                return acc;
              }, {} as Record<string, any>) || {};
            }
          }
          
          // Agrupar items por order_id
          orderItems = items.reduce((acc, item) => {
            if (!acc[item.order_id]) {
              acc[item.order_id] = [];
            }
            
            // Intentar obtener el título del producto de diferentes formas
            let productTitle = 'Producto';
            
            // 1. Si el item tiene title directamente
            if (item.title) {
              productTitle = item.title;
            }
            // 2. Si el item tiene product_title
            else if (item.product_title) {
              productTitle = item.product_title;
            }
            // 3. Si el item tiene name
            else if (item.name) {
              productTitle = item.name;
            }
            // 4. Usar el mapa de productos
            else if (item.product_id && productsMap[item.product_id]) {
              productTitle = productsMap[item.product_id].title;
            }
            
            const itemWithTitle = {
              ...item,
              title: productTitle,
              price_cents: item.price_cents || 0
            };
            
            console.log('📦 Item procesado:', {
              order_id: item.order_id?.substring(0, 8),
              product_id: item.product_id,
              title: itemWithTitle.title,
              price_cents: itemWithTitle.price_cents,
              qty: item.qty || item.quantity || 1
            });
            
            acc[item.order_id].push(itemWithTitle);
            return acc;
          }, {} as Record<string, any[]>);
        }
      }
    }

    // 4. Formatear datos finales
    const formattedOrders = orders?.map(order => ({
      ...order,
      buyer_name: buyersMap[order.user_id]?.name || 'Cliente',
      items: orderItems[order.id] || []
    })) || [];

    console.log('📋 Pedidos formateados:', formattedOrders.length);
    formattedOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ID: ${order.id.substring(0, 8)}, Total: $${order.total_cents}, Items: ${order.items.length}`);
      order.items.forEach((item, itemIndex) => {
        console.log(`    ${itemIndex + 1}. ${item.title} - $${item.price_cents} x${item.qty || item.quantity || 1}`);
      });
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders: formattedOrders,
        debug: {
          ordersCount: orders?.length || 0,
          itemsCount: Object.values(orderItems).reduce((sum, items) => sum + items.length, 0),
          buyersCount: Object.keys(buyersMap).length
        }
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en modo emergencia:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
