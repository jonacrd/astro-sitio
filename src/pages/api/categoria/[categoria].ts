import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-config';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { categoria } = params;
    
    if (!categoria) {
      return new Response(JSON.stringify({ error: 'Categoría no especificada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createSupabaseServerClient();
    
    // Buscar productos de la categoría con información del vendedor
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price_cents,
        image_url,
        stock,
        seller_id,
        category,
        created_at,
        profiles!products_seller_id_fkey (
          name,
          phone,
          is_active
        )
      `)
      .eq('category', categoria)
      .eq('profiles.is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando productos:', error);
      return new Response(JSON.stringify({ error: 'Error cargando productos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Agrupar productos por vendedor
    const vendorsMap = new Map();
    
    products?.forEach(product => {
      const sellerId = product.seller_id;
      if (!vendorsMap.has(sellerId)) {
        vendorsMap.set(sellerId, {
          id: sellerId,
          name: product.profiles?.name || 'Vendedor',
          phone: product.profiles?.phone || '',
          isActive: product.profiles?.is_active || false,
          products: []
        });
      }
      vendorsMap.get(sellerId).products.push(product);
    });

    const vendors = Array.from(vendorsMap.values());

    // Calcular estadísticas
    const stats = {
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.isActive).length,
      totalProducts: products?.length || 0
    };

    return new Response(JSON.stringify({
      success: true,
      categoria,
      stats,
      vendors,
      products: products || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API de categoría:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
