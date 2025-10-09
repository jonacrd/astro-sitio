import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Debugging precios...');
    
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
    
    // 1. Verificar órdenes recientes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_cents, payment_method, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('📊 Órdenes encontradas:', orders?.length || 0);
    
    // 2. Verificar order_items de la orden más reciente
    let orderItems = [];
    let products = [];
    
    if (orders && orders.length > 0) {
      const latestOrderId = orders[0].id;
      
      // Obtener order_items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', latestOrderId);

      if (itemsError) {
        console.log('❌ Error obteniendo order_items:', itemsError);
      } else {
        orderItems = items || [];
        console.log('📦 Order items encontrados:', orderItems.length);
        
        // Obtener product_ids
        const productIds = orderItems.map(item => item.product_id).filter(Boolean);
        
        if (productIds.length > 0) {
          // Obtener productos
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('id, title, price_cents')
            .in('id', productIds);

          if (productsError) {
            console.log('❌ Error obteniendo productos:', productsError);
          } else {
            products = productsData || [];
            console.log('🛍️ Productos encontrados:', products.length);
          }
        }
      }
    }

    // 3. Verificar algunos productos directamente
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('products')
      .select('id, title, price_cents')
      .limit(5);

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders: orders?.map(order => ({
          id: order.id.substring(0, 8),
          total_cents: order.total_cents,
          total_pesos: (order.total_cents / 100).toFixed(2),
          payment_method: order.payment_method,
          created_at: order.created_at
        })) || [],
        orderItems: orderItems.map(item => ({
          id: item.id,
          order_id: item.order_id?.substring(0, 8),
          product_id: item.product_id,
          title: item.title,
          price_cents: item.price_cents,
          price_pesos: ((item.price_cents || 0) / 100).toFixed(2),
          qty: item.qty || item.quantity || 1
        })),
        products: products.map(product => ({
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          price_pesos: ((product.price_cents || 0) / 100).toFixed(2)
        })),
        sampleProducts: sampleProducts?.map(product => ({
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          price_pesos: ((product.price_cents || 0) / 100).toFixed(2)
        })) || [],
        debug: {
          ordersCount: orders?.length || 0,
          orderItemsCount: orderItems.length,
          productsCount: products.length,
          sampleProductsCount: sampleProducts?.length || 0
        }
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en check-prices:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
