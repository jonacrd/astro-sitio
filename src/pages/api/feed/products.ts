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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parámetros de paginación
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    console.log(`🔍 Cargando feed - página ${page}, límite ${limit}`);

    // Query optimizada con índices específicos
    const { data: sellerProducts, error: productsError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
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
      .eq('seller.is_active', true) // Solo vendedores activos
      .order('created_at', { ascending: false }) // Ordenar por más recientes
      .range(offset, offset + limit - 1);

    if (productsError) {
      console.error('Error obteniendo productos del feed:', productsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos: ' + productsError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Formatear datos para el frontend
    const formattedProducts = sellerProducts?.map(item => ({
      id: item.product_id,
      title: item.product.title,
      description: item.product.description,
      category: item.product.category,
      image_url: item.product.image_url,
      price_cents: item.price_cents,
      seller_id: item.seller_id,
      seller_name: item.seller?.name || 'Vendedor',
      seller_active: item.seller?.is_active !== false,
      stock: item.stock,
      inventory_mode: 'count',
      available_today: true,
      sold_out: false
    })) || [];

    console.log(`✅ Feed cargado: ${formattedProducts.length} productos`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          page,
          limit,
          hasMore: formattedProducts.length === limit
        }
      }
    }), {
      headers: { 
        'content-type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache por 1 minuto
      }
    });

  } catch (error: any) {
    console.error('Error en /api/feed/products:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
