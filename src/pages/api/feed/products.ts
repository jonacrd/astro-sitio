import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  console.log('🚀 API /api/feed/products iniciada');
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔧 Variables de entorno:', {
      url: supabaseUrl ? '✅ Configurada' : '❌ No configurada',
      serviceKey: supabaseServiceKey ? '✅ Configurada' : '❌ No configurada'
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno no configuradas');
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('🔌 Creando cliente Supabase...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Cliente Supabase creado');
    
    // Parámetros de paginación
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    console.log(`🔍 Cargando feed - página ${page}, límite ${limit}`);

    // Query optimizada con índices específicos - Soporte para ambos modos de inventario
    const { data: sellerProducts, error: productsError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        inventory_mode,
        available_today,
        portion_limit,
        portion_used,
        sold_out,
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
      .eq('seller.is_active', true) // Solo vendedores activos
      .or('and(inventory_mode.eq.count,stock.gt.0),and(inventory_mode.eq.availability,available_today.eq.true,sold_out.eq.false)') // Productos con stock O disponibles hoy
      .order('product_id', { ascending: false }) // Ordenar por ID de producto
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
      inventory_mode: item.inventory_mode || 'count',
      available_today: item.available_today || false,
      sold_out: item.sold_out || false,
      portion_limit: item.portion_limit,
      portion_used: item.portion_used || 0
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
