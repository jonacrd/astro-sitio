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
        console.log('🔍 Detalles del error JOIN:', {
          message: itemsError.message,
          details: itemsError.details,
          hint: itemsError.hint,
          code: itemsError.code
        });
        
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
            console.log('🔍 Obteniendo productos para IDs:', productIds);
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('id, title, price_cents')
              .in('id', productIds);

            if (productsError) {
              console.log('⚠️ Error obteniendo productos:', productsError.message);
              console.log('🔍 Detalles del error productos:', {
                message: productsError.message,
                details: productsError.details,
                hint: productsError.hint
              });
            } else {
              console.log('✅ Productos obtenidos:', products?.length || 0);
              if (products && products.length > 0) {
                console.log('🔍 Primer producto:', {
                  id: products[0].id,
                  title: products[0].title,
                  price_cents: products[0].price_cents
                });
              }
              productsMap = products?.reduce((acc, product) => {
                acc[product.id] = product;
                return acc;
              }, {} as Record<string, any>) || {};
            }
          } else {
            console.log('⚠️ No hay product_ids para buscar productos');
          }

          // Combinar items con información de productos
          orderItems = itemsOnly?.reduce((acc, item) => {
            if (!acc[item.order_id]) {
              acc[item.order_id] = [];
            }
            
            const product = productsMap[item.product_id];
            const finalItem = {
              ...item,
              title: product?.title || item.title || 'Producto',
              price_cents: product?.price_cents || item.price_cents || 0
            };
            
            console.log('🔍 Combinando item:', {
              order_id: item.order_id,
              product_id: item.product_id,
              product_found: !!product,
              final_title: finalItem.title,
              final_price: finalItem.price_cents
            });
            
            acc[item.order_id].push(finalItem);
            return acc;
          }, {} as Record<string, any[]>) || {};
        }
      } else {
        // JOIN funcionó correctamente
        console.log('✅ JOIN funcionó correctamente, procesando items...');
        console.log('🔍 Items con JOIN:', items?.length || 0);
        if (items && items.length > 0) {
          console.log('🔍 Primer item con JOIN:', {
            order_id: items[0].order_id,
            product_id: items[0].product_id,
            title_from_join: items[0].product?.title,
            price_from_join: items[0].product?.price_cents
          });
        }
        
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


