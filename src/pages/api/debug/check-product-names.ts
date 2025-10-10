import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
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
    
    console.log('🔍 Verificando nombres de productos en pedidos...');

    // 1. Obtener pedidos recientes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_cents, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

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

    const orderIds = orders?.map(order => order.id) || [];
    console.log('📋 IDs de pedidos:', orderIds);

    // 2. Intentar JOIN con productos (sin price_cents que no existe)
    console.log('🔄 Intentando JOIN con productos...');
    const { data: itemsWithJoin, error: joinError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products!order_items_product_id_fkey(
          id,
          title
        )
      `)
      .in('order_id', orderIds);

    console.log('🔗 Resultado del JOIN:');
    console.log('  - Error:', joinError?.message || 'Ninguno');
    console.log('  - Items encontrados:', itemsWithJoin?.length || 0);
    
    if (itemsWithJoin && itemsWithJoin.length > 0) {
        console.log('  - Primer item:', {
          order_id: itemsWithJoin[0].order_id,
          product_id: itemsWithJoin[0].product_id,
          title_from_join: itemsWithJoin[0].product?.title,
          price_from_item: itemsWithJoin[0].price_cents
        });
    }

    // 3. Método alternativo - obtener items sin JOIN
    console.log('🔄 Método alternativo - items sin JOIN...');
    const { data: itemsOnly, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    console.log('📦 Items sin JOIN:');
    console.log('  - Error:', itemsError?.message || 'Ninguno');
    console.log('  - Items encontrados:', itemsOnly?.length || 0);

    if (itemsOnly && itemsOnly.length > 0) {
      const productIds = [...new Set(itemsOnly.map(item => item.product_id).filter(Boolean))];
      console.log('  - Product IDs únicos:', productIds);

        // 4. Obtener productos por separado
        if (productIds.length > 0) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, title')
            .in('id', productIds);

        console.log('🏷️ Productos encontrados:');
        console.log('  - Error:', productsError?.message || 'Ninguno');
        console.log('  - Productos encontrados:', products?.length || 0);
        
        if (products && products.length > 0) {
          console.log('  - Primer producto:', {
            id: products[0].id,
            title: products[0].title
          });
        }
      }
    }

    // 5. Verificar estructura de tablas
    console.log('🔍 Verificando estructura de tablas...');
    
    const { data: orderItemsStructure, error: orderItemsStructureError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    const { data: productsStructure, error: productsStructureError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders: orders?.map(order => ({
          id: order.id.substring(0, 8),
          total_cents: order.total_cents,
          status: order.status,
          created_at: order.created_at
        })) || [],
        joinResult: {
          success: !joinError,
          error: joinError?.message || null,
          itemsCount: itemsWithJoin?.length || 0,
          sampleItem: itemsWithJoin?.[0] ? {
            order_id: itemsWithJoin[0].order_id?.substring(0, 8),
            product_id: itemsWithJoin[0].product_id,
            title_from_join: itemsWithJoin[0].product?.title,
            price_from_item: itemsWithJoin[0].price_cents
          } : null
        },
        alternativeResult: {
          success: !itemsError,
          error: itemsError?.message || null,
          itemsCount: itemsOnly?.length || 0,
          productIds: itemsOnly ? [...new Set(itemsOnly.map(item => item.product_id).filter(Boolean))] : []
        },
        tablesStructure: {
          order_items_has_data: !orderItemsStructureError && orderItemsStructure && orderItemsStructure.length > 0,
          products_has_data: !productsStructureError && productsStructure && productsStructure.length > 0,
          order_items_error: orderItemsStructureError?.message || null,
          products_error: productsStructureError?.message || null
        }
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en debug de nombres de productos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
