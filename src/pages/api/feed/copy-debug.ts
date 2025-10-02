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

    // Obtener todos los productos sin filtros
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .limit(10);

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
          products: [],
          total: 0,
          message: 'No hay productos en seller_products'
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

    // Formatear datos
    const formattedProducts = sellerProducts.map(sp => {
      const product = productMap[sp.product_id];
      const seller = sellerMap[sp.seller_id];

      if (!product || !seller) {
        return {
          id: `${sp.seller_id}::${sp.product_id}`,
          productId: sp.product_id,
          sellerId: sp.seller_id,
          title: 'Producto no encontrado',
          description: 'Descripción no disponible',
          category: 'N/A',
          imageUrl: null,
          priceCents: sp.price_cents,
          stock: sp.stock,
          sellerName: 'Vendedor no encontrado',
          sellerPhone: 'N/A',
          isOnline: false,
          productUrl: `/producto/${sp.product_id}?seller=${sp.seller_id}`,
          addToCartUrl: `/api/cart/add?sellerProductId=${sp.seller_id}::${sp.product_id}&qty=1`
        };
      }

      return {
        id: `${sp.seller_id}::${sp.product_id}`,
        productId: sp.product_id,
        sellerId: sp.seller_id,
        title: product.title,
        description: product.description,
        category: product.category,
        imageUrl: product.image_url,
        priceCents: sp.price_cents,
        stock: sp.stock,
        sellerName: seller.name,
        sellerPhone: seller.phone,
        isOnline: false,
        productUrl: `/producto/${sp.product_id}?seller=${sp.seller_id}`,
        addToCartUrl: `/api/cart/add?sellerProductId=${sp.seller_id}::${sp.product_id}&qty=1`
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        products: formattedProducts,
        total: formattedProducts.length
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







