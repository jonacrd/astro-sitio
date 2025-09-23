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

    // Obtener datos del request
    const { cartItemId, qty } = await request.json();

    if (!cartItemId || qty === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'cartItemId y qty son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el item pertenece al usuario
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        carts!inner(user_id)
      `)
      .eq('id', cartItemId)
      .single();

    if (itemError || !cartItem) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Item del carrito no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (cartItem.carts.user_id !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para modificar este item'
      }), { 
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (qty <= 0) {
      // Eliminar item
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (deleteError) {
        console.error('Error eliminando item:', deleteError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error eliminando item: ' + deleteError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }
    } else {
      // Actualizar cantidad
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ qty: Math.round(qty) })
        .eq('id', cartItemId);

      if (updateError) {
        console.error('Error actualizando item:', updateError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error actualizando item: ' + updateError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }
    }

    // Obtener resumen actualizado del carrito
    const { data: cartItems, error: summaryError } = await supabase
      .from('cart_items')
      .select('id, product_id, title, price_cents, qty')
      .eq('cart_id', cartItem.cart_id);

    if (summaryError) {
      console.error('Error obteniendo resumen:', summaryError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo resumen: ' + summaryError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular totales
    const itemCount = cartItems?.reduce((sum, item) => sum + item.qty, 0) || 0;
    const totalCents = cartItems?.reduce((sum, item) => sum + (item.price_cents * item.qty), 0) || 0;

    return new Response(JSON.stringify({
      success: true,
      message: qty <= 0 ? 'Item eliminado del carrito' : 'Cantidad actualizada',
      itemCount,
      totalCents,
      items: cartItems || []
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
