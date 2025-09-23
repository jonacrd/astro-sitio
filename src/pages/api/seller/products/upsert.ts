import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
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

    // Obtener datos del request
    const body = await request.json();
    const { title, description, category, image_url, price_cents, stock, active = true } = body;

    if (!title || !description || !category || price_cents === undefined || stock === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'title, description, category, price_cents y stock son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Crear producto
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title,
        description,
        category,
        image_url: image_url || null
      })
      .select('id')
      .single();

    if (productError) {
      console.error('Error creando producto:', productError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error creando producto: ' + productError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Agregar a vendedor
    const { data: sellerProduct, error: sellerProductError } = await supabase
      .from('seller_products')
      .insert({
        seller_id: user.id,
        product_id: product.id,
        price_cents: price_cents,
        stock: stock,
        active: active
      })
      .select('id')
      .single();

    if (sellerProductError) {
      console.error('Error agregando producto a vendedor:', sellerProductError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error agregando producto: ' + sellerProductError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        productId: product.id,
        sellerProductId: sellerProduct.id
      },
      message: 'Producto agregado exitosamente'
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/products/upsert:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};