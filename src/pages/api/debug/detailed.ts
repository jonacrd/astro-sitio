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

    console.log('🔍 Debug detallado...');

    // 1. Verificar seller_products con filtros
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active, updated_at')
      .eq('active', true)
      .gt('stock', 0);

    console.log('Seller products query result:', {
      count: sellerProducts?.length || 0,
      error: spError?.message || null,
      firstItem: sellerProducts?.[0] || null
    });

    // 2. Verificar seller_products sin filtros
    const { data: allSellerProducts, error: aspError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active, updated_at');

    console.log('All seller products:', {
      count: allSellerProducts?.length || 0,
      error: aspError?.message || null,
      firstItem: allSellerProducts?.[0] || null
    });

    // 3. Verificar productos
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(5);

    console.log('Products:', {
      count: products?.length || 0,
      error: pError?.message || null,
      firstItem: products?.[0] || null
    });

    // 4. Verificar vendedores
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);

    console.log('Sellers:', {
      count: sellers?.length || 0,
      error: sError?.message || null,
      firstItem: sellers?.[0] || null
    });

    // 5. Verificar estados
    const { data: statuses, error: stError } = await supabase
      .from('seller_status')
      .select('seller_id, online');

    console.log('Statuses:', {
      count: statuses?.length || 0,
      error: stError?.message || null,
      firstItem: statuses?.[0] || null
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        sellerProducts: {
          count: sellerProducts?.length || 0,
          error: spError?.message || null,
          items: sellerProducts?.slice(0, 3) || []
        },
        allSellerProducts: {
          count: allSellerProducts?.length || 0,
          error: aspError?.message || null,
          items: allSellerProducts?.slice(0, 3) || []
        },
        products: {
          count: products?.length || 0,
          error: pError?.message || null,
          items: products?.slice(0, 3) || []
        },
        sellers: {
          count: sellers?.length || 0,
          error: sError?.message || null,
          items: sellers?.slice(0, 3) || []
        },
        statuses: {
          count: statuses?.length || 0,
          error: stError?.message || null,
          items: statuses?.slice(0, 3) || []
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
