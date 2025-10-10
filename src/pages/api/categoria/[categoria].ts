import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { categoria } = params;
    
    if (!categoria) {
      return new Response(JSON.stringify({ error: 'Categoría no especificada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Cliente de solo lectura (igual que otros endpoints estables)
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      return new Response(JSON.stringify({ error: 'Variables de entorno de Supabase faltantes' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);
    
    // Buscar productos de la categoría con información del vendedor
    // SOLO productos con stock > 0 y vendedores activos
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,title,price_cents,image_url,stock,seller_id,category,created_at,
        profiles!inner(id,name,phone,is_active)
      `)
      .eq('category', categoria)
      .gt('stock', 0) // Solo productos con stock
      .eq('profiles.is_active', true) // Solo vendedores activos
      .order('created_at', { ascending: false });

    console.log(`🔍 Consulta para categoría "${categoria}":`, { 
      productsFound: products?.length || 0, 
      error: error?.message 
    });

    if (error) {
      console.error('Error cargando productos:', error);
      return new Response(JSON.stringify({ error: 'Error cargando productos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Agrupar productos por vendedor (ya tenemos la info del vendedor en el JOIN)
    const vendorsMap = new Map();
    (products || []).forEach(product => {
      const sellerId = product.seller_id;
      const sellerProfile = product.profiles; // Info del vendedor desde el JOIN
      
      if (!vendorsMap.has(sellerId)) {
        vendorsMap.set(sellerId, {
          id: sellerId,
          name: sellerProfile.name || 'Vendedor',
          phone: sellerProfile.phone || '',
          isActive: sellerProfile.is_active || false,
          products: []
        });
      }
      
      // Agregar producto sin la info del vendedor (ya está en el vendedor)
      const productWithoutProfile = { ...product };
      delete productWithoutProfile.profiles;
      vendorsMap.get(sellerId).products.push(productWithoutProfile);
    });

    const vendors = Array.from(vendorsMap.values());

    // Calcular estadísticas
    const stats = {
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.isActive).length,
      totalProducts: products?.length || 0,
      hasProducts: (products?.length || 0) > 0
    };

    return new Response(JSON.stringify({
      success: true,
      categoria,
      stats,
      vendors,
      products: products || [],
      message: stats.hasProducts 
        ? `Encontrados ${stats.totalProducts} productos de ${stats.activeVendors} vendedores activos`
        : `No hay productos disponibles en la categoría "${categoria}" en este momento.`
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

