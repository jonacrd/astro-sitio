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

    // Obtener todos los carritos del usuario
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select(`
        id,
        seller_id
      `)
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
          items: [],
          totalCents: 0,
          itemCount: 0
        }
      }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener items de todos los carritos
    const cartIds = carts.map(cart => cart.id);
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        title,
        price_cents,
        qty
      `)
      .in('cart_id', cartIds);

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

    // Obtener información de vendedores
    const sellerIds = [...new Set(carts.map(cart => cart.seller_id))];
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', sellerIds);

    if (sellersError) {
      console.error('Error obteniendo vendedores:', sellersError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo vendedores: ' + sellersError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Crear mapa de vendedores
    const sellerMap = sellers?.reduce((acc, seller) => {
      acc[seller.id] = seller.name;
      return acc;
    }, {} as Record<string, string>) || {};

    // Formatear datos
    const formattedItems = cartItems?.map(item => {
      const cart = carts.find(c => c.id === item.cart_id);
      return {
        id: item.id,
        cartId: item.cart_id,
        productId: item.product_id,
        title: item.title,
        priceCents: item.price_cents,
        qty: item.qty,
        sellerId: cart?.seller_id || '',
        sellerName: cart?.seller_id ? sellerMap[cart.seller_id] || 'Vendedor' : 'Vendedor',
        totalCents: item.price_cents * item.qty
      };
    }) || [];

    const totalCents = formattedItems.reduce((sum, item) => sum + item.totalCents, 0);
    const itemCount = formattedItems.reduce((sum, item) => sum + item.qty, 0);

    return new Response(JSON.stringify({
      success: true,
      data: {
        items: formattedItems,
        totalCents,
        itemCount
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/cart/items:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
