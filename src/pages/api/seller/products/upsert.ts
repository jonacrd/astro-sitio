import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
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
    
    // Obtener token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorización requerido'
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

    // Verificar que el usuario es vendedor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_seller')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_seller) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no es vendedor'
      }), { 
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener datos del request
    const { product_id, price_cents, stock, active = true } = await request.json();

    if (!product_id || price_cents === undefined || stock === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'product_id, price_cents y stock son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Validar que el producto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Producto no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Upsert en seller_products
    const { data, error } = await supabase
      .from('seller_products')
      .upsert({
        seller_id: user.id,
        product_id: product_id,
        price_cents: Math.round(price_cents),
        stock: Math.max(0, Math.round(stock)),
        active: Boolean(active)
      }, {
        onConflict: 'seller_id,product_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting seller product:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error guardando producto: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Producto guardado exitosamente',
      data: {
        ...data,
        product_title: product.title
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
