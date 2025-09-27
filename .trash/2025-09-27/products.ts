import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Verificar productos base
    const { data: baseProducts, error: bpError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(5);
    
    // 2. Verificar vendedores
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);
    
    // 3. Verificar productos por vendedor
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active');
    
    // 4. Verificar estados
    const { data: status, error: stError } = await supabase
      .from('seller_status')
      .select('seller_id, online');
    
    // 5. Query completa
    const { data: fullQuery, error: fqError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          id,
          title,
          description,
          category,
          image_url
        ),
        seller:profiles!inner(
          id,
          name,
          phone
        )
      `)
      .eq('active', true)
      .gt('stock', 0);

    return new Response(JSON.stringify({
      success: true,
      data: {
        baseProducts: {
          count: baseProducts?.length || 0,
          error: bpError?.message || null,
          items: baseProducts?.slice(0, 3) || []
        },
        sellers: {
          count: sellers?.length || 0,
          error: sError?.message || null,
          items: sellers?.slice(0, 3) || []
        },
        sellerProducts: {
          count: sellerProducts?.length || 0,
          error: spError?.message || null,
          items: sellerProducts?.slice(0, 3) || []
        },
        status: {
          count: status?.length || 0,
          error: stError?.message || null,
          items: status?.slice(0, 3) || []
        },
        fullQuery: {
          count: fullQuery?.length || 0,
          error: fqError?.message || null,
          items: fullQuery?.slice(0, 3) || []
        }
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error inesperado:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};