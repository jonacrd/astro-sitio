import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
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

    // Obtener todos los productos sin filtros
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .limit(20);

    if (spError) {
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
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo sellers: ' + sError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
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

    // Formatear resultados
    const results = sellerProducts.map(sp => {
      const product = productMap[sp.product_id];
      const seller = sellerMap[sp.seller_id];

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
        online: false,
        delivery: false,
        stock: sp.stock,
        sellerProductId: `${sp.seller_id}::${sp.product_id}`,
        productUrl: `/producto/${sp.product_id}?seller=${sp.seller_id}`,
        addToCartUrl: `/api/cart/add?sellerProductId=${sp.seller_id}::${sp.product_id}&qty=1`
      };
    }).filter(Boolean);

    return new Response(JSON.stringify({
      success: true,
      data: {
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
