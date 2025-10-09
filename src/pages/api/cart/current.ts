import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request }) => {
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

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const sellerId = url.searchParams.get('sellerId');

    if (!sellerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'sellerId es requerido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Buscar carrito para este usuario y vendedor
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('seller_id', sellerId)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      console.error('Error buscando carrito:', cartError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error buscando carrito: ' + cartError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!cart) {
      // No hay carrito para este vendedor
      return new Response(JSON.stringify({
        success: true,
        data: {
          cartId: null,
          items: [],
          itemCount: 0,
          totalCents: 0
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener items del carrito
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('id, product_id, title, price_cents, qty')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error obteniendo items del carrito:', itemsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo items: ' + itemsError.message
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
      data: {
        cartId: cart.id,
        items: cartItems || [],
        itemCount,
        totalCents
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











