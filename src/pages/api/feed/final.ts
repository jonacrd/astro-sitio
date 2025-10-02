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
    
    console.log('🔍 Obteniendo productos del feed...');

    // Query simple sin joins complejos
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active, updated_at')
      .eq('active', true)
      .gt('stock', 0)
      .limit(20);

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

    console.log(`✅ Seller products obtenidos: ${sellerProducts?.length || 0}`);

    if (!sellerProducts || sellerProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          total: 0,
          message: 'No hay productos disponibles'
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

    console.log('Maps created:', {
      productMap: Object.keys(productMap).length,
      sellerMap: Object.keys(sellerMap).length,
      statusMap: Object.keys(statusMap).length
    });

    // Formatear datos
    const formattedProducts = sellerProducts.map(sp => {
      const product = productMap[sp.product_id];
      const seller = sellerMap[sp.seller_id];
      const isOnline = statusMap[sp.seller_id] || false;

      console.log('Processing item:', {
        sellerId: sp.seller_id,
        productId: sp.product_id,
        hasProduct: !!product,
        hasSeller: !!seller,
        isOnline
      });

      if (!product || !seller) {
        console.log('Skipping item - missing product or seller:', {
          product: !!product,
          seller: !!seller
        });
        return null;
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
        isOnline: isOnline,
        updatedAt: sp.updated_at,
        productUrl: `/producto/${sp.product_id}?seller=${sp.seller_id}`,
        addToCartUrl: `/api/cart/add?sellerProductId=${sp.seller_id}::${sp.product_id}&qty=1`
      };
    }).filter(Boolean);

    console.log(`✅ Productos formateados: ${formattedProducts.length}`);

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







