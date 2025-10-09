import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verificar estructura de tabla products
    const { data: productsColumns, error: productsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'products')
      .eq('table_schema', 'public');

    // 2. Verificar estructura de tabla seller_products
    const { data: sellerProductsColumns, error: sellerProductsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'seller_products')
      .eq('table_schema', 'public');

    // 3. Verificar si existe la columna created_by
    const hasCreatedBy = productsColumns?.some(col => col.column_name === 'created_by');

    // 4. Verificar columnas de inventory_mode
    const inventoryColumns = sellerProductsColumns?.filter(col => 
      ['inventory_mode', 'available_today', 'portion_limit', 'portion_used', 'sold_out'].includes(col.column_name)
    ) || [];

    // 5. Verificar RLS policies
    const { data: productsPolicies, error: productsPoliciesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, permissive')
      .eq('tablename', 'products');

    const { data: sellerProductsPolicies, error: sellerProductsPoliciesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, permissive')
      .eq('tablename', 'seller_products');

    // 6. Verificar si hay productos creados por vendedores
    const { data: customProducts, error: customProductsError } = await supabase
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
          profiles!inner(name)
        )
      `)
      .not('created_by', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    // 7. Verificar vendedores activos
    const { data: activeSellers, error: activeSellersError } = await supabase
      .from('profiles')
      .select('id, name, email, is_seller, is_active')
      .eq('is_seller', true)
      .eq('is_active', true)
      .limit(5);

    return new Response(JSON.stringify({
      success: true,
      data: {
        database: {
          productsColumns: productsColumns || [],
          sellerProductsColumns: sellerProductsColumns || [],
          hasCreatedBy,
          inventoryColumns: inventoryColumns.map(col => col.column_name),
          productsPolicies: productsPolicies || [],
          sellerProductsPolicies: sellerProductsPolicies || []
        },
        customProducts: customProducts || [],
        activeSellers: activeSellers || [],
        errors: {
          productsError: productsError?.message,
          sellerProductsError: sellerProductsError?.message,
          productsPoliciesError: productsPoliciesError?.message,
          sellerProductsPoliciesError: sellerProductsPoliciesError?.message,
          customProductsError: customProductsError?.message,
          activeSellersError: activeSellersError?.message
        }
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en debug de creación de productos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};



