import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const qRaw = (url.searchParams.get('q') || '').trim();
    
    if (!qRaw) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter "q" is required'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('Text analyzed:', qRaw);
    
    // Conectar a Supabase
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

    // Query simple sin joins complejos
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .limit(10);

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

    if (!sellerProducts || sellerProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          query: qRaw,
          results: [],
          total: 0
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener productos
    const productIds = sellerProducts.map(sp => sp.product_id);
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

    // Obtener vendedores
    const sellerIds = sellerProducts.map(sp => sp.seller_id);
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .in('id', sellerIds);

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

    // Obtener estados
    const { data: statuses, error: stError } = await supabase
      .from('seller_status')
      .select('seller_id, online')
      .in('seller_id', sellerIds);

    if (stError) {
      console.error('Error obteniendo statuses:', stError);
    }

    // Crear mapas para joins
    const productMap = products?.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {}) || {};

    const sellerMap = sellers?.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {}) || {};

    const statusMap = statuses?.reduce((acc, s) => {
      acc[s.seller_id] = s.online;
      return acc;
    }, {}) || {};

    // Filtrar por término de búsqueda
    const searchTerm = qRaw.toLowerCase();
    const filteredSellerProducts = sellerProducts.filter(sp => {
      const product = productMap[sp.product_id];
      if (!product) return false;
      
      const titleMatch = product.title.toLowerCase().includes(searchTerm);
      const descMatch = product.description?.toLowerCase().includes(searchTerm) || false;
      const categoryMatch = product.category?.toLowerCase().includes(searchTerm) || false;
      
      return titleMatch || descMatch || categoryMatch;
    });

    // Formatear resultados
    const results = filteredSellerProducts.map(sp => {
      const product = productMap[sp.product_id];
      const seller = sellerMap[sp.seller_id];
      const isOnline = statusMap[sp.seller_id] || false;

      if (!product || !seller) return null;

      return {
        productId: sp.product_id,
        productTitle: product.title,
        category: product.category,
        priceCents: sp.price_cents,
        price: `$${(sp.price_cents / 100).toFixed(2)}`,
        imageUrl: product.image_url,
        sellerId: sp.seller_id,
        sellerName: seller.name,
        online: isOnline,
        delivery: isOnline, // Asumimos que vendedores online hacen delivery
        stock: sp.stock,
        sellerProductId: `${sp.seller_id}::${sp.product_id}`,
        productUrl: `/producto/${sp.product_id}?seller=${sp.seller_id}`,
        addToCartUrl: `/api/cart/add?sellerProductId=${sp.seller_id}::${sp.product_id}&qty=1`
      };
    }).filter(Boolean);

    console.log(`✅ Resultados encontrados: ${results.length}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        query: qRaw,
        results: results,
        total: results.length
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
