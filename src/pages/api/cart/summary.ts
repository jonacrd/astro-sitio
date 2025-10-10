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

    // Obtener todos los carritos del usuario
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id);

    if (cartsError) {
      console.error('Error obteniendo carritos:', cartsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo carritos: ' + cartsError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!carts || carts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          itemCount: 0,
          totalCents: 0,
          cartCount: 0
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener todos los items de todos los carritos
    const cartIds = carts.map(cart => cart.id);
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('qty, price_cents')
      .in('cart_id', cartIds);

    if (itemsError) {
      console.error('Error obteniendo items:', itemsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo items: ' + itemsError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular totales globales
    const itemCount = cartItems?.reduce((sum, item) => sum + item.qty, 0) || 0;
    const totalCents = cartItems?.reduce((sum, item) => sum + (item.price_cents * item.qty), 0) || 0;

    return new Response(JSON.stringify({
      success: true,
      data: {
        itemCount,
        totalCents,
        cartCount: carts.length
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












