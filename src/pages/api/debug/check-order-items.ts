import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Verificando estructura de order_items...');
    
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
    
    // Verificar la estructura de order_items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(5);

    if (orderItemsError) {
      console.error('❌ Error consultando order_items:', orderItemsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error consultando order_items: ' + orderItemsError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('📊 Order items encontrados:', orderItems?.length || 0);
    
    // Verificar la estructura de products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, price_cents')
      .limit(5);

    if (productsError) {
      console.error('❌ Error consultando products:', productsError);
    }

    console.log('📊 Products encontrados:', products?.length || 0);

    // Intentar hacer JOIN
    const { data: joinedData, error: joinError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products!order_items_product_id_fkey(
          title,
          price_cents
        )
      `)
      .limit(3);

    if (joinError) {
      console.error('❌ Error en JOIN:', joinError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        orderItems: orderItems?.map(item => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          title: item.title,
          price_cents: item.price_cents,
          qty: item.qty || item.quantity
        })) || [],
        products: products || [],
        joinedData: joinedData?.map(item => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          title: item.title,
          price_cents: item.price_cents,
          qty: item.qty || item.quantity,
          product: item.product
        })) || [],
        joinError: joinError ? joinError.message : null
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en check-order-items:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

