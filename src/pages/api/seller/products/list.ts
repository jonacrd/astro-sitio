import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request }) => {
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

    // Usar service role key para bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no autenticado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que es vendedor
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_seller')
      .eq('id', user.id)
      .single();

    if (!profile?.is_seller) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos de vendedor'
      }), { 
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener productos del vendedor
    const { data: products, error } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        updated_at,
        product:products!inner(
          id,
          title,
          description,
          category,
          image_url
        )
      `)
      .eq('seller_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo productos:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Formatear datos
    const formattedProducts = products?.map(item => ({
      id: `${item.seller_id}::${item.product_id}`, // ID compuesto
      product_id: item.product_id,
      title: item.product.title,
      description: item.product.description,
      category: item.product.category,
      image_url: item.product.image_url,
      price_cents: item.price_cents,
      stock: item.stock,
      active: item.active,
      updated_at: item.updated_at
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      data: {
        products: formattedProducts,
        total: formattedProducts.length
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/products/list:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};