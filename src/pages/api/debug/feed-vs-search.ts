import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Comparando feed vs búsqueda...');

    // 1. FEED: Usando Service Role Key (como en /api/feed/products)
    const { data: feedProducts, error: feedError } = await supabaseService
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
        seller:profiles!seller_products_seller_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .eq('seller.is_active', true)
      .limit(10);

    // 2. BÚSQUEDA: Usando Anon Key (como en /api/search/ai)
    const { data: searchProducts, error: searchError } = await supabaseAnon
      .from('seller_products')
      .select(`
        seller_id, 
        product_id, 
        price_cents, 
        stock, 
        active
      `)
      .eq('active', true)
      .gt('stock', 0)
      .limit(10);

    // 3. Obtener productos para búsqueda
    const productIds = searchProducts?.map(sp => sp.product_id) || [];
    const { data: products, error: pError } = await supabaseAnon
      .from('products')
      .select('id, title, description, category, image_url')
      .in('id', productIds);

    // 4. Obtener vendedores para búsqueda
    const sellerIds = [...new Set(searchProducts?.map(sp => sp.seller_id) || [])];
    const { data: sellers, error: sError } = await supabaseAnon
      .from('profiles')
      .select('id, name, is_active')
      .in('id', sellerIds)
      .eq('is_seller', true)
      .eq('is_active', true);

    // 5. Combinar datos de búsqueda
    const searchCombined = searchProducts?.map(sp => {
      const product = products?.find(p => p.id === sp.product_id);
      const seller = sellers?.find(s => s.id === sp.seller_id);
      
      if (!product || !seller) return null;
      
      return {
        id: sp.product_id,
        title: product.title,
        category: product.category,
        seller_name: seller.name,
        seller_active: seller.is_active,
        stock: sp.stock,
        active: sp.active
      };
    }).filter(Boolean) || [];

    // 6. Formatear datos del feed
    const feedFormatted = feedProducts?.map(item => ({
      id: item.product_id,
      title: item.product.title,
      category: item.product.category,
      seller_name: item.seller?.name || 'Vendedor',
      seller_active: item.seller?.is_active !== false,
      stock: item.stock,
      active: item.active
    })) || [];

    console.log(`📊 Feed: ${feedFormatted.length} productos`);
    console.log(`🔍 Búsqueda: ${searchCombined.length} productos`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        feed: {
          count: feedFormatted.length,
          products: feedFormatted,
          error: feedError?.message
        },
        search: {
          count: searchCombined.length,
          products: searchCombined,
          error: searchError?.message || pError?.message || sError?.message
        },
        comparison: {
          feedProductIds: feedFormatted.map(p => p.id),
          searchProductIds: searchCombined.map(p => p.id),
          missingInSearch: feedFormatted.filter(f => !searchCombined.some(s => s.id === f.id)),
          missingInFeed: searchCombined.filter(s => !feedFormatted.some(f => f.id === s.id))
        }
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error comparando feed vs búsqueda:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

