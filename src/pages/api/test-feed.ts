import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
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

    // Usar service role key para bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Probando consulta con service role...');

    // Consulta simple
    const { data: products, error } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        updated_at,
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
      .gt('stock', 0)
      .limit(10);

    console.log('📊 Resultado:', { products: products?.length || 0, error: error?.message });

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener estados online de los vendedores
    const sellerIds = products?.map(item => item.seller_id) || [];
    let sellerStatuses = {};
    
    if (sellerIds.length > 0) {
      const { data: statuses } = await supabase
        .from('seller_status')
        .select('seller_id, online')
        .in('seller_id', sellerIds);
      
      sellerStatuses = statuses?.reduce((acc, status) => {
        acc[status.seller_id] = status.online;
        return acc;
      }, {}) || {};
    }

    // Formatear datos para el frontend
    const formattedProducts = products?.map(item => ({
      id: `${item.seller_id}::${item.product_id}`,
      productId: item.product_id,
      sellerId: item.seller_id,
      title: item.product.title,
      description: item.product.description,
      category: item.product.category,
      imageUrl: item.product.image_url,
      priceCents: item.price_cents,
      stock: item.stock,
      sellerName: item.seller.name,
      sellerPhone: item.seller.phone,
      isOnline: sellerStatuses[item.seller_id] || false,
      updatedAt: item.updated_at,
      productUrl: `/producto/${item.product_id}?seller=${item.seller_id}`,
      addToCartUrl: `/api/cart/add?sellerProductId=${item.seller_id}::${item.product_id}&qty=1`
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      data: {
        products: formattedProducts,
        total: formattedProducts.length,
        filters: { category: null, featured: false, offers: false, newProducts: false }
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/test-feed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
