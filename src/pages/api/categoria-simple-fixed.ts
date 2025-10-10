import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('🚀 Iniciando API de categoría simple...');
    
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Buscando productos para categoría:', categoria);
    
    // Usar la misma consulta que el feed - con seller_products y vendedores activos
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
      .or('and(inventory_mode.eq.count,stock.gt.0),and(inventory_mode.eq.availability,available_today.eq.true,sold_out.eq.false)')
      .limit(50);
    
    if (error) {
      console.error('Error obteniendo productos:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }
    
    console.log('✅ Productos encontrados:', sellerProducts?.length || 0);
    
    // Formatear productos
    const formattedProducts = sellerProducts?.map(item => ({
      id: item.product_id,
      title: item.product.title,
      description: item.product.description,
      category: item.product.category,
      image_url: item.product.image_url,
      price_cents: item.price_cents,
      seller_id: item.seller_id,
      seller_name: item.seller?.name || 'Vendedor',
      stock: item.stock
    })) || [];
    
    // Agrupar por vendedor
    const vendorsMap = new Map();
    formattedProducts.forEach(product => {
      const sellerId = product.seller_id;
      if (!vendorsMap.has(sellerId)) {
        vendorsMap.set(sellerId, {
          id: sellerId,
          name: product.seller_name,
          phone: '',
          isActive: true,
          products: []
        });
      }
      vendorsMap.get(sellerId).products.push(product);
    });
    
    const vendors = Array.from(vendorsMap.values());
    
    const stats = {
      totalVendors: vendors.length,
      activeVendors: vendors.length,
      totalProducts: formattedProducts.length,
      hasProducts: formattedProducts.length > 0
    };
    
    console.log('✅ Stats:', stats);
    
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
        'Cache-Control': 'public, max-age=60'
      }
    });
    
  } catch (error: any) {
    console.error('Error en /api/categoria-simple-fixed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
