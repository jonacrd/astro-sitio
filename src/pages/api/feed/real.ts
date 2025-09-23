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
    
            // Obtener parámetros de consulta
            const limit = parseInt(url.searchParams.get('limit') || '20', 10);
            const category = url.searchParams.get('category') || null;
            const sellerId = url.searchParams.get('sellerId') || null;
            const featured = url.searchParams.get('featured') === 'true';
            const offers = url.searchParams.get('offers') === 'true';
            const newProducts = url.searchParams.get('new') === 'true';

    // console.log('🔍 API /feed/real - Parámetros de consulta:', { limit, category, sellerId, featured, offers, newProducts });

    // Construir query base
    let query = supabase
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
      .gt('stock', 0);

            // Aplicar filtros
            if (category) {
              query = query.eq('product.category', category);
            }

            if (sellerId) {
              query = query.eq('seller_id', sellerId);
            }

    if (featured) {
      // Productos destacados: mayor stock
      query = query.order('stock', { ascending: false });
    }

    if (offers) {
      // Productos en oferta: precio menor a 5000 centavos
      query = query.lt('price_cents', 5000);
    }

    if (newProducts) {
      // Productos nuevos: creados en los últimos 7 días
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('updated_at', weekAgo.toISOString());
    }

    // Ordenar por fecha de actualización (más recientes primero)
    query = query.order('updated_at', { ascending: false });

    // Aplicar límite
    query = query.limit(limit);

    const { data: products, error } = await query;

    // console.log('📊 API /feed/real - Resultado de la consulta:', { 
    //   products: products?.length || 0, 
    //   error: error?.message,
    //   sellerId: sellerId,
    //   firstProductSeller: products?.[0]?.seller?.name || 'N/A'
    // });

    if (error) {
      console.error('Error obteniendo productos del feed:', error);
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
      id: `${item.seller_id}::${item.product_id}`, // ID compuesto
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
      // URLs para acciones
      productUrl: `/producto/${item.product_id}?seller=${item.seller_id}`,
      addToCartUrl: `/api/cart/add?sellerProductId=${item.seller_id}::${item.product_id}&qty=1`
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      data: {
        products: formattedProducts,
        total: formattedProducts.length,
        filters: {
          category,
          featured,
          offers,
          newProducts
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
