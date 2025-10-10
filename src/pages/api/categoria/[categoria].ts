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
    
    // Primero obtener productos de la categoría con stock
    const { data: products, error } = await supabase
      .from('products')
      .select('id,title,price_cents,image_url,stock,seller_id,category,created_at')
      .eq('category', categoria)
      .gt('stock', 0) // Solo productos con stock
      .order('created_at', { ascending: false });

    console.log(`🔍 Productos encontrados para "${categoria}":`, products?.length || 0);

    if (error) {
      console.error('Error cargando productos:', error);
      return new Response(JSON.stringify({ error: 'Error cargando productos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener información de vendedores activos
    const sellerIds = Array.from(new Set((products || []).map(p => p.seller_id).filter(Boolean)));
    let profilesMap: Record<string, { name: string; phone: string; is_active: boolean }> = {};
    
    if (sellerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id,name,phone,is_active')
        .in('id', sellerIds)
        .eq('is_active', true); // Solo vendedores activos

      console.log(`👥 Vendedores activos encontrados:`, profiles?.length || 0);

      if (!profilesError && profiles) {
        profilesMap = profiles.reduce((acc, p) => {
          acc[p.id] = { name: p.name || 'Vendedor', phone: p.phone || '', is_active: !!p.is_active };
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Filtrar productos solo de vendedores activos
    const activeProducts = (products || []).filter(product => 
      profilesMap[product.seller_id]?.is_active === true
    );

    console.log(`✅ Productos de vendedores activos:`, activeProducts.length);

    // Agrupar productos por vendedor
    const vendorsMap = new Map();
    activeProducts.forEach(product => {
      const sellerId = product.seller_id;
      const sellerProfile = profilesMap[sellerId];
      
      if (!vendorsMap.has(sellerId)) {
        vendorsMap.set(sellerId, {
          id: sellerId,
          name: sellerProfile?.name || 'Vendedor',
          phone: sellerProfile?.phone || '',
          isActive: sellerProfile?.is_active || false,
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
      totalProducts: activeProducts.length,
      hasProducts: activeProducts.length > 0
    };

    return new Response(JSON.stringify({
      success: true,
      categoria,
      stats,
      vendors,
      products: activeProducts,
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


