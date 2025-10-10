import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('🧪 Probando consulta de categoría...');
    
    const categoria = url.searchParams.get('categoria') || 'minimarkets';
    
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Variables de entorno faltantes' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Prueba 1: Consulta simple de productos
    console.log('🔍 Prueba 1: Consulta simple de productos...');
    const { data: simpleProducts, error: simpleError } = await supabase
      .from('products')
      .select('id, title, category')
      .eq('category', categoria)
      .limit(5);

    console.log('📊 Resultado consulta simple:', {
      products: simpleProducts?.length || 0,
      error: simpleError?.message || null
    });

    // Prueba 2: Consulta de seller_products
    console.log('🔍 Prueba 2: Consulta de seller_products...');
    const { data: sellerProducts, error: sellerError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        active,
        product:products!inner(
          id,
          title,
          category
        )
      `)
      .eq('active', true)
      .eq('product.category', categoria)
      .limit(5);

    console.log('📊 Resultado seller_products:', {
      products: sellerProducts?.length || 0,
      error: sellerError?.message || null
    });

    // Prueba 3: Consulta con perfiles
    console.log('🔍 Prueba 3: Consulta con perfiles...');
    const { data: fullQuery, error: fullError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        active,
        product:products!inner(
          id,
          title,
          category
        ),
        seller:profiles!seller_products_seller_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('active', true)
      .eq('product.category', categoria)
      .eq('seller.is_active', true)
      .limit(5);

    console.log('📊 Resultado consulta completa:', {
      products: fullQuery?.length || 0,
      error: fullError?.message || null
    });

    return new Response(JSON.stringify({
      success: true,
      categoria,
      results: {
        simpleProducts: {
          count: simpleProducts?.length || 0,
          error: simpleError?.message || null,
          sample: simpleProducts?.slice(0, 2) || []
        },
        sellerProducts: {
          count: sellerProducts?.length || 0,
          error: sellerError?.message || null,
          sample: sellerProducts?.slice(0, 2) || []
        },
        fullQuery: {
          count: fullQuery?.length || 0,
          error: fullError?.message || null,
          sample: fullQuery?.slice(0, 2) || []
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en prueba:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
