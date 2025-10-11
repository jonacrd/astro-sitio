import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ params }) => {
  try {
    console.log('🚀 Iniciando API de categoría...');
    
    const { categoria } = params;
    console.log('📝 Categoría solicitada:', categoria);
    
    if (!categoria) {
      console.log('❌ Categoría no especificada');
      return new Response(JSON.stringify({ error: 'Categoría no especificada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Cliente de solo lectura (igual que otros endpoints estables)
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔑 Variables de entorno:', {
      url: supabaseUrl ? '✅ Presente' : '❌ Faltante',
      anon: supabaseAnon ? '✅ Presente' : '❌ Faltante'
    });

    if (!supabaseUrl || !supabaseAnon) {
      console.log('❌ Variables de entorno faltantes');
      return new Response(JSON.stringify({ error: 'Variables de entorno de Supabase faltantes' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);
    console.log('✅ Cliente Supabase creado');
    
    // Primero obtener productos de la categoría con stock
    console.log('🔍 Buscando productos para categoría:', categoria);
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id,title,price_cents,image_url,stock,seller_id,category,created_at')
      .eq('category', categoria)
      .gt('stock', 0) // Solo productos con stock
      .order('created_at', { ascending: false });

    console.log(`🔍 Resultado de consulta productos:`, {
      productsFound: products?.length || 0,
      error: error?.message || null,
      errorCode: error?.code || null
    });

    if (error) {
      console.error('❌ Error cargando productos:', error);
      return new Response(JSON.stringify({ 
        error: 'Error cargando productos',
        details: error.message,
        code: error.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener información de vendedores activos
    const sellerIds = Array.from(new Set((products || []).map(p => p.seller_id).filter(Boolean)));
    console.log('👥 IDs de vendedores encontrados:', sellerIds);
    
    let profilesMap: Record<string, { name: string; phone: string; is_active: boolean }> = {};
    
    if (sellerIds.length > 0) {
      console.log('🔍 Buscando perfiles de vendedores...');
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id,name,phone,is_active')
        .in('id', sellerIds)
        .eq('is_active', true); // Solo vendedores activos

      console.log(`👥 Resultado de consulta perfiles:`, {
        profilesFound: profiles?.length || 0,
        error: profilesError?.message || null,
        errorCode: profilesError?.code || null
      });

      if (profilesError) {
        console.error('❌ Error cargando perfiles:', profilesError);
        return new Response(JSON.stringify({ 
          error: 'Error cargando perfiles de vendedores',
          details: profilesError.message,
          code: profilesError.code
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (profiles) {
        profilesMap = profiles.reduce((acc, p) => {
          acc[p.id] = { name: p.name || 'Vendedor', phone: p.phone || '', is_active: !!p.is_active };
          return acc;
        }, {} as Record<string, any>);
        console.log('✅ Perfiles mapeados:', Object.keys(profilesMap));
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




