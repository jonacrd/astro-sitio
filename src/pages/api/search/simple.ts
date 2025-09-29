import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
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
    
    const query = url.searchParams.get('q') || '';
    console.log('🔍 Buscando:', query);

    if (!query.trim()) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          total: 0,
          message: 'Query vacía'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // Buscar productos activos con stock
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active, updated_at')
      .eq('active', true)
      .gt('stock', 0)
      .limit(20);

    if (spError) {
      console.error('Error obteniendo seller_products:', spError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo seller_products: ' + spError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!sellerProducts || sellerProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          total: 0,
          message: 'No hay productos disponibles'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener productos
    const productIds = sellerProducts.map(sp => sp.product_id);
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, title, description, category, image_url')
      .in('id', productIds);

    if (pError) {
      console.error('Error obteniendo products:', pError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo products: ' + pError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener vendedores
    const sellerIds = sellerProducts.map(sp => sp.seller_id);
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', sellerIds);

    if (sError) {
      console.error('Error obteniendo sellers:', sError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo sellers: ' + sError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Combinar datos y filtrar por búsqueda
    const combinedProducts = sellerProducts.map(sp => {
      const product = products?.find(p => p.id === sp.product_id);
      const seller = sellers?.find(s => s.id === sp.seller_id);
      
      return {
        id: sp.product_id,
        title: product?.title || 'Producto',
        description: product?.description || '',
        category: product?.category || 'General',
        image: product?.image_url || '/img/placeholders/product-placeholder.jpg',
        price: sp.price_cents,
        stock: sp.stock,
        sellerId: sp.seller_id,
        sellerName: seller?.name || 'Vendedor',
        active: sp.active,
        updated_at: sp.updated_at
      };
    }).filter(product => 
      product.title.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      product.sellerName.toLowerCase().includes(query.toLowerCase())
    );

    console.log(`✅ Resultados de búsqueda: ${combinedProducts.length}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        results: combinedProducts,
        total: combinedProducts.length,
        message: 'Búsqueda completada'
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error inesperado:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};