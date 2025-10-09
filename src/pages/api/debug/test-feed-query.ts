import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
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

    console.log('🔍 Probando query del feed...');

    // 1. Query original (solo stock > 0)
    const { data: originalQuery, error: originalError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        inventory_mode,
        available_today,
        sold_out,
        product:products!inner(
          id,
          title,
          category
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

    // 2. Query nueva (con OR para availability)
    const { data: newQuery, error: newError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        inventory_mode,
        available_today,
        sold_out,
        product:products!inner(
          id,
          title,
          category
        ),
        seller:profiles!seller_products_seller_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('active', true)
      .eq('seller.is_active', true)
      .or('and(inventory_mode.eq.count,stock.gt.0),and(inventory_mode.eq.availability,available_today.eq.true,sold_out.eq.false)')
      .limit(10);

    // 3. Query para productos de modo availability específicamente
    const { data: availabilityQuery, error: availabilityError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        inventory_mode,
        available_today,
        sold_out,
        product:products!inner(
          id,
          title,
          category
        ),
        seller:profiles!seller_products_seller_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('active', true)
      .eq('inventory_mode', 'availability')
      .eq('available_today', true)
      .eq('sold_out', false)
      .eq('seller.is_active', true);

    // 4. Verificar todos los productos creados recientemente
    const { data: recentProducts, error: recentError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        category,
        created_by,
        created_at,
        seller_products!inner(
          seller_id,
          price_cents,
          stock,
          active,
          inventory_mode,
          available_today,
          sold_out,
          profiles!inner(
            id,
            name,
            is_active,
            is_seller
          )
        )
      `)
      .not('created_by', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    return new Response(JSON.stringify({
      success: true,
      data: {
        queries: {
          original: {
            count: originalQuery?.length || 0,
            products: originalQuery?.map(p => ({
              id: p.product_id,
              title: p.product.title,
              category: p.product.category,
              stock: p.stock,
              inventory_mode: p.inventory_mode,
              available_today: p.available_today,
              sold_out: p.sold_out
            })) || [],
            error: originalError?.message
          },
          new: {
            count: newQuery?.length || 0,
            products: newQuery?.map(p => ({
              id: p.product_id,
              title: p.product.title,
              category: p.product.category,
              stock: p.stock,
              inventory_mode: p.inventory_mode,
              available_today: p.available_today,
              sold_out: p.sold_out
            })) || [],
            error: newError?.message
          },
          availability: {
            count: availabilityQuery?.length || 0,
            products: availabilityQuery?.map(p => ({
              id: p.product_id,
              title: p.product.title,
              category: p.product.category,
              stock: p.stock,
              inventory_mode: p.inventory_mode,
              available_today: p.available_today,
              sold_out: p.sold_out
            })) || [],
            error: availabilityError?.message
          }
        },
        recentProducts: recentProducts?.map(p => ({
          id: p.id,
          title: p.title,
          category: p.category,
          created_at: p.created_at,
          seller_product: p.seller_products[0] ? {
            seller_id: p.seller_products[0].seller_id,
            stock: p.seller_products[0].stock,
            active: p.seller_products[0].active,
            inventory_mode: p.seller_products[0].inventory_mode,
            available_today: p.seller_products[0].available_today,
            sold_out: p.seller_products[0].sold_out,
            seller_name: p.seller_products[0].profiles.name,
            seller_active: p.seller_products[0].profiles.is_active,
            seller_is_seller: p.seller_products[0].profiles.is_seller
          } : null
        })) || [],
        errors: {
          recentError: recentError?.message
        }
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en test-feed-query:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};


