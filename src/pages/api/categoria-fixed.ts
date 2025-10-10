import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('🚀 Iniciando API de categoría arreglada...');
    
    const categoria = url.searchParams.get('categoria');
    console.log('📝 Categoría solicitada:', categoria);
    
    if (!categoria) {
      return new Response(JSON.stringify({ error: 'Categoría no especificada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Credenciales reales de Supabase
    const supabaseUrl = 'https://prizpqahcluomioxnmex.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXpwcWFoY2x1b21pb3hubWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc5MjE2MiwiZXhwIjoyMDczMzY4MTYyfQ.wDrqbDNCtrNdNQ30RRaR1G6oySFUdLUWt0hb9CcUxbk';
    
    console.log('🔌 Creando cliente Supabase con credenciales hardcodeadas...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Cliente Supabase creado');
    
    // Usar EXACTAMENTE la misma consulta que el feed
    console.log('🔍 Buscando productos usando la misma lógica que el feed...');
    
    let query = supabase
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
          phone,
          is_active
        )
      `)
      .eq('active', true)
      .eq('seller.is_active', true) // Solo vendedores activos
      .eq('product.category', categoria) // Filtrar por categoría
      .or('and(inventory_mode.eq.count,stock.gt.0),and(inventory_mode.eq.availability,available_today.eq.true,sold_out.eq.false)'); // Productos con stock O disponibles hoy

    const { data: sellerProducts, error: productsError } = await query
      .order('product_id', { ascending: false }) // Ordenar por ID de producto
      .limit(50); // Límite más alto para categorías

    console.log('📊 Resultado de consulta:', {
      productsFound: sellerProducts?.length || 0,
      error: productsError?.message || null,
      errorCode: productsError?.code || null
    });

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
      sold_out: item.sold_out || false,
      portion_limit: item.portion_limit,
      portion_used: item.portion_used || 0
    })) || [];

    console.log(`✅ Productos formateados: ${formattedProducts.length}`);

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
      message: stats.hasProducts 
        ? `Encontrados ${stats.totalProducts} productos de ${stats.activeVendors} vendedores activos`
        : `No hay productos disponibles en la categoría "${categoria}" en este momento.`
    }), {
      status: 200,
      headers: { 
        'content-type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache por 1 minuto
      }
    });

  } catch (error: any) {
    console.error('Error en /api/categoria-fixed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
