import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('🚀 Iniciando API simple de categoría...');
    
    const categoria = url.searchParams.get('categoria');
    console.log('📝 Categoría solicitada:', categoria);
    
    if (!categoria) {
      return new Response(JSON.stringify({ error: 'Categoría no especificada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Variables de entorno faltantes' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Usar la misma estructura que el feed
    console.log('🔍 Buscando productos usando seller_products...');
    console.log('📝 Categoría a buscar:', categoria);
    
    const { data: sellerProducts, error } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        inventory_mode,
        available_today,
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
          phone,
          is_active
        )
      `)
      .eq('active', true)
      .eq('seller.is_active', true)
      .eq('product.category', categoria)
      .or('and(inventory_mode.eq.count,stock.gt.0),and(inventory_mode.eq.availability,available_today.eq.true,sold_out.eq.false)');

    console.log('🔍 Query ejecutada, resultado:', {
      productsFound: sellerProducts?.length || 0,
      error: error?.message || null,
      errorCode: error?.code || null,
      errorDetails: error?.details || null
    });

    console.log(`📦 Productos encontrados:`, sellerProducts?.length || 0);

    if (error) {
      console.error('❌ Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Error cargando productos',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Formatear productos como en el feed
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
      sold_out: item.sold_out || false
    })) || [];

    // Si no hay productos, devolver mensaje
    if (!formattedProducts || formattedProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        categoria,
        stats: {
          totalVendors: 0,
          activeVendors: 0,
          totalProducts: 0,
          hasProducts: false
        },
        vendors: [],
        products: [],
        message: `No hay productos disponibles en la categoría "${categoria}" en este momento.`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Agrupar productos por vendedor
    const vendorsMap = new Map();
    formattedProducts.forEach(product => {
      const sellerId = product.seller_id;
      
      if (!vendorsMap.has(sellerId)) {
        vendorsMap.set(sellerId, {
          id: sellerId,
          name: product.seller_name,
          phone: '', // Se puede agregar si está disponible
          isActive: product.seller_active,
          products: []
        });
      }
      
      vendorsMap.get(sellerId).products.push(product);
    });

    const vendors = Array.from(vendorsMap.values());

    const stats = {
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.isActive).length,
      totalProducts: formattedProducts.length,
      hasProducts: formattedProducts.length > 0
    };

    console.log('✅ Respuesta preparada:', stats);

    return new Response(JSON.stringify({
      success: true,
      categoria,
      stats,
      vendors,
      products: formattedProducts,
      message: `Encontrados ${stats.totalProducts} productos de ${stats.activeVendors} vendedores activos`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en API simple:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};