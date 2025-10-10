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
    
    console.log('🔍 Obteniendo TODOS los productos del feed...');

    // Obtener TODOS los productos del feed (sin límite)
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
          description,
          category,
          image_url
        ),
        seller:profiles!seller_products_seller_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .eq('seller.is_active', true);

    if (feedError) {
      console.error('Error obteniendo productos del feed:', feedError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos: ' + feedError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Formatear datos
    const formattedProducts = feedProducts?.map(item => ({
      id: item.product_id,
      title: item.product.title,
      description: item.product.description,
      category: item.product.category,
      image_url: item.product.image_url,
      price_cents: item.price_cents,
      seller_id: item.seller_id,
      seller_name: item.seller?.name || 'Vendedor',
      seller_active: item.seller?.is_active !== false,
      stock: item.stock,
      active: item.active
    })) || [];

    // Buscar productos específicos
    const arepas = formattedProducts.filter(p => 
      p.title.toLowerCase().includes('arepa') || 
      p.title.toLowerCase().includes('maiz')
    );
    
    const pizzas = formattedProducts.filter(p => 
      p.title.toLowerCase().includes('pizza')
    );

    console.log(`📊 Total productos en feed: ${formattedProducts.length}`);
    console.log(`🌽 Arepas encontradas: ${arepas.length}`);
    console.log(`🍕 Pizzas encontradas: ${pizzas.length}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        total: formattedProducts.length,
        products: formattedProducts,
        specific: {
          arepas: arepas,
          pizzas: pizzas
        },
        categories: [...new Set(formattedProducts.map(p => p.category))],
        sellers: [...new Set(formattedProducts.map(p => p.seller_name))]
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error obteniendo todos los productos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};




