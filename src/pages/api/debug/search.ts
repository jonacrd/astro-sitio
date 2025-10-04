import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
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
    
    const query = url.searchParams.get('q') || '';
    console.log('🔍 Debug búsqueda:', query);

    // 1. Verificar productos activos
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select(`
        seller_id, 
        product_id, 
        price_cents, 
        stock, 
        active
      `)
      .eq('active', true);

    if (spError) {
      console.error('Error obteniendo seller_products:', spError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo seller_products: ' + spError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 2. Obtener productos
    const productIds = sellerProducts?.map(sp => sp.product_id) || [];
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, title, description, category, image_url')
      .in('id', productIds);

    if (pError) {
      console.error('Error obteniendo products:', pError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo products: ' + pError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 3. Obtener vendedores
    const sellerIds = [...new Set(sellerProducts?.map(sp => sp.seller_id) || [])];
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name, is_active, is_seller')
      .in('id', sellerIds)
      .eq('is_seller', true)
      .eq('is_active', true);

    if (sError) {
      console.error('Error obteniendo sellers:', sError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo sellers: ' + sError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 4. Combinar datos
    const combinedProducts = sellerProducts?.map(sp => {
      const product = products?.find(p => p.id === sp.product_id);
      const seller = sellers?.find(s => s.id === sp.seller_id);
      
      if (!product || !seller) return null;
      
      return {
        id: sp.product_id,
        title: product.title,
        description: product.description,
        category: product.category,
        image: product.image_url || '/img/placeholders/product-placeholder.jpg',
        price: sp.price_cents,
        stock: sp.stock,
        sellerId: sp.seller_id,
        sellerName: seller.name,
        active: sp.active
      };
    }).filter(Boolean) || [];

    // 5. Búsqueda específica
    let searchResults = [];
    if (query) {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
      
      searchResults = combinedProducts.filter(product => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.sellerName.toLowerCase().includes(query.toLowerCase()) ||
        searchTerms.some(term => 
          product.title.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.sellerName.toLowerCase().includes(term)
        )
      );
    }

    // 6. Estadísticas
    const stats = {
      totalSellerProducts: sellerProducts?.length || 0,
      totalProducts: products?.length || 0,
      totalSellers: sellers?.length || 0,
      combinedProducts: combinedProducts.length,
      searchResults: searchResults.length,
      categories: [...new Set(products?.map(p => p.category) || [])],
      productTitles: products?.map(p => p.title) || []
    };

    console.log('📊 Debug stats:', stats);

    return new Response(JSON.stringify({
      success: true,
      data: {
        stats,
        allProducts: combinedProducts,
        searchResults: searchResults,
        query: query,
        message: 'Debug completado'
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error inesperado en debug:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
