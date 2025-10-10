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
    const { data: products, error } = await supabase
      .from('products')
      .select('id,title,price_cents,image_url,stock,seller_id,category,created_at')
      .eq('category', categoria)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando productos:', error);
      return new Response(JSON.stringify({ error: 'Error cargando productos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener perfiles de vendedores en una segunda consulta
    const sellerIds = Array.from(new Set((products || []).map(p => p.seller_id).filter(Boolean)));
    let profilesMap: Record<string, { name: string; phone: string; is_active: boolean }> = {};
    if (sellerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id,name,phone,is_active')
        .in('id', sellerIds);

      if (!profilesError && profiles) {
        profilesMap = profiles.reduce((acc, p) => {
          acc[p.id] = { name: p.name || 'Vendedor', phone: p.phone || '', is_active: !!p.is_active };
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Agrupar productos por vendedor
    const vendorsMap = new Map();
    (products || []).forEach(product => {
      const sellerId = product.seller_id;
      if (!vendorsMap.has(sellerId)) {
        const prof = profilesMap[sellerId] || { name: 'Vendedor', phone: '', is_active: false };
        vendorsMap.set(sellerId, {
          id: sellerId,
          name: prof.name,
          phone: prof.phone,
          isActive: prof.is_active,
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

