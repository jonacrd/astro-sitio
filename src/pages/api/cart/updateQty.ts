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

    // Obtener datos del request
    const body = await request.json();
    const { cartItemId, qty } = body;

    if (!cartItemId || qty === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'cartItemId y qty son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener el cart_id del item
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select('cart_id')
      .eq('id', cartItemId)
      .single();

    if (itemError || !cartItem) {
      console.error('Error obteniendo item del carrito:', itemError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Item del carrito no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el carrito pertenece al usuario
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('id', cartItem.cart_id)
      .eq('user_id', user.id)
      .single();

    if (cartError || !cart) {
      console.error('Error verificando carrito:', cartError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Carrito no encontrado o no tienes permisos'
      }), { 
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (qty === 0) {
      // Eliminar item del carrito
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (deleteError) {
        console.error('Error eliminando item del carrito:', deleteError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error eliminando item del carrito: ' + deleteError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }
    } else {
      // Actualizar cantidad
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ qty })
        .eq('id', cartItemId);

      if (updateError) {
        console.error('Error actualizando cantidad:', updateError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error actualizando cantidad: ' + updateError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }
    }

    // Obtener carrito actualizado
    const { data: updatedCart, error: updatedCartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (updatedCartError || !updatedCart) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo carrito'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener items actualizados del carrito
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('qty, price_cents')
      .eq('cart_id', updatedCart.id);

    if (itemsError) {
      console.error('Error obteniendo items del carrito:', itemsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo items del carrito: ' + itemsError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular totales
    const itemCount = cartItems?.reduce((sum, item) => sum + item.qty, 0) || 0;
    const totalCents = cartItems?.reduce((sum, item) => sum + (item.qty * item.price_cents), 0) || 0;

    return new Response(JSON.stringify({
      success: true,
      data: {
        itemCount,
        totalCents,
        items: cartItems
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/cart/updateQty:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};