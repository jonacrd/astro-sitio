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
    const { productId, price_cents, stock, active } = body;

    if (!productId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'productId es requerido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Parsear productId (formato: "sellerId::productId")
    const [sellerId, actualProductId] = productId.split('::');
    
    if (!sellerId || !actualProductId || sellerId !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Producto no encontrado o no tienes permisos'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Actualizar producto
    const updateData: any = {};
    if (price_cents !== undefined) updateData.price_cents = price_cents;
    if (stock !== undefined) updateData.stock = stock;
    if (active !== undefined) updateData.active = active;

    const { error: updateError } = await supabase
      .from('seller_products')
      .update(updateData)
      .eq('seller_id', user.id)
      .eq('product_id', actualProductId);

    if (updateError) {
      console.error('Error actualizando producto:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando producto: ' + updateError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Producto actualizado exitosamente'
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/products/update:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
