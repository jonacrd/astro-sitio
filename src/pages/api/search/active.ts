import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const qRaw = (url.searchParams.get('q') || '').trim();
    
    if (!qRaw) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter "q" is required'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('🔍 Búsqueda activa:', qRaw);
    
    // Conectar a Supabase
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Buscar productos activos con stock
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        products!inner (
          id,
          title,
          description,
          category,
          image_url
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .ilike('products.title', `%${qRaw}%`)
      .limit(20);

    if (spError) {
      console.error('❌ Error obteniendo productos activos:', spError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos activos: ' + spError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!sellerProducts || sellerProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          query: qRaw,
          results: [],
          total: 0,
          message: 'No se encontraron productos activos'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // 2. Obtener información de vendedores con estado online
    const sellerIds = [...new Set(sellerProducts.map(sp => sp.seller_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .in('id', sellerIds)
      .eq('is_seller', true);

    if (profilesError) {
      console.error('❌ Error obteniendo vendedores:', profilesError);
    }

    // 3. Obtener estado online de vendedores
    const { data: sellerStatus, error: statusError } = await supabase
      .from('seller_status')
      .select('seller_id, online')
      .in('seller_id', sellerIds);

    if (statusError) {
      console.error('❌ Error obteniendo estado de vendedores:', statusError);
    }

    // 4. Crear mapa de vendedores con estado online
    const sellersMap = new Map();
    const statusMap = new Map();
    
    if (profiles) {
      profiles.forEach(profile => {
        sellersMap.set(profile.id, profile);
      });
    }
    
    if (sellerStatus) {
      sellerStatus.forEach(status => {
        statusMap.set(status.seller_id, status);
      });
    }

    // 5. Transformar resultados con estado online
    const results = sellerProducts.map(sp => {
      const seller = sellersMap.get(sp.seller_id);
      const status = statusMap.get(sp.seller_id);
      return {
        id: `${sp.seller_id}-${sp.product_id}`,
        productId: sp.product_id,
        title: sp.products.title,
        description: sp.products.description,
        category: sp.products.category,
        image_url: sp.products.image_url,
        price: Math.round(sp.price_cents / 100),
        price_cents: sp.price_cents,
        stock: sp.stock,
        sellerId: sp.seller_id,
        sellerName: seller?.name || 'Vendedor',
        sellerOnline: status?.online || false,
        isActive: sp.active,
        // URLs para acciones
        productUrl: `/producto/${sp.product_id}`,
        addToCartUrl: `/api/cart/add?productId=${sp.product_id}&sellerId=${sp.seller_id}`,
        sellerUrl: `/vendedor/${sp.seller_id}`
      };
    });

    // 6. Ordenar resultados: vendedores online primero, luego por stock, luego por precio
    results.sort((a, b) => {
      // Vendedores online primero (prioridad máxima)
      if (a.sellerOnline !== b.sellerOnline) {
        return a.sellerOnline ? -1 : 1;
      }
      // Mayor stock primero
      if (b.stock !== a.stock) {
        return b.stock - a.stock;
      }
      // Menor precio primero
      return a.price_cents - b.price_cents;
    });

    // 7. Agrupar por vendedor para mostrar productos relacionados
    const groupedResults = results.reduce((acc, product) => {
      const sellerId = product.sellerId;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: {
            id: product.sellerId,
            name: product.sellerName,
            online: product.sellerOnline
          },
          products: []
        };
      }
      acc[sellerId].products.push(product);
      return acc;
    }, {} as Record<string, { seller: any; products: any[] }>);

    console.log(`✅ Búsqueda completada: ${results.length} productos de ${Object.keys(groupedResults).length} vendedores`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        query: qRaw,
        results: results,
        groupedResults: groupedResults,
        total: results.length,
        sellersCount: Object.keys(groupedResults).length,
        message: `Encontrados ${results.length} productos de ${Object.keys(groupedResults).length} vendedores activos`
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en búsqueda activa:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + (error as Error).message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
