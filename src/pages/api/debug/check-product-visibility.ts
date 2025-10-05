import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener productos creados recientemente
    const { data: recentProducts, error: recentError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        category,
        image_url,
        created_by,
        created_at,
        seller_products!inner(
          seller_id,
          price_cents,
          stock,
          active,
          inventory_mode,
          available_today,
          portion_limit,
          portion_used,
          sold_out
        )
      `)
      .not('created_by', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24 horas
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('Error obteniendo productos recientes:', recentError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos recientes: ' + recentError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 2. Para cada producto, verificar si cumple criterios del feed
    const productAnalysis = await Promise.all(
      (recentProducts || []).map(async (product) => {
        const sellerProduct = product.seller_products[0];
        
        // Obtener información del vendedor
        const { data: seller, error: sellerError } = await supabase
          .from('profiles')
          .select('id, name, is_active, is_seller')
          .eq('id', sellerProduct.seller_id)
          .single();

        if (sellerError) {
          console.error('Error obteniendo vendedor:', sellerError);
        }

        // Verificar criterios del feed
        const criteria = {
          productActive: sellerProduct.active,
          hasStock: sellerProduct.stock > 0,
          sellerActive: seller?.is_active === true,
          sellerIsSeller: seller?.is_seller === true,
          allCriteriaMet: sellerProduct.active && 
                         sellerProduct.stock > 0 && 
                         seller?.is_active === true && 
                         seller?.is_seller === true
        };

        return {
          product: {
            id: product.id,
            title: product.title,
            category: product.category,
            created_at: product.created_at,
            created_by: product.created_by
          },
          sellerProduct: {
            seller_id: sellerProduct.seller_id,
            price_cents: sellerProduct.price_cents,
            stock: sellerProduct.stock,
            active: sellerProduct.active,
            inventory_mode: sellerProduct.inventory_mode
          },
          seller: seller,
          criteria,
          appearsInFeed: criteria.allCriteriaMet
        };
      })
    );

    // 3. Verificar productos que SÍ aparecen en el feed (para comparar)
    const { data: feedProducts, error: feedError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          id,
          title,
          category,
          created_by
        ),
        seller:profiles!seller_products_seller_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .eq('seller.is_active', true)
      .limit(10);

    return new Response(JSON.stringify({
      success: true,
      data: {
        recentProducts: productAnalysis,
        feedProducts: feedProducts || [],
        summary: {
          totalRecentProducts: productAnalysis.length,
          visibleInFeed: productAnalysis.filter(p => p.appearsInFeed).length,
          notVisibleInFeed: productAnalysis.filter(p => !p.appearsInFeed).length
        }
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en check-product-visibility:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

