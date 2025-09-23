import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  // Endpoint GET para casos de prueba sin autenticación
  const sellerProductId = url.searchParams.get('sellerProductId');
  const qty = parseInt(url.searchParams.get('qty') || '1', 10);

  if (!sellerProductId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'sellerProductId requerido'
    }), { 
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  // Parsear sellerProductId (formato: "sellerId::productId")
  const [sellerId, productId] = sellerProductId.split('::');
  
  if (!sellerId || !productId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'sellerProductId debe tener formato "sellerId::productId"'
    }), { 
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  // Simular respuesta exitosa para pruebas
  return new Response(JSON.stringify({
    success: true,
    message: 'Producto agregado al carrito (modo prueba)',
    sellerId,
    productId,
    qty,
    itemCount: qty,
    totalCents: 1000 * qty, // Precio simulado
    items: [{
      id: 'mock-item',
      product_id: productId,
      title: 'Producto de prueba',
      price_cents: 1000,
      qty: qty
    }]
  }), { 
    headers: { 'content-type': 'application/json' }
  });
};

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
    const body = await request.json();
    console.log('📦 Datos recibidos en POST /api/cart/add:', body);
    
    const { sellerId, productId, title, price_cents, qty } = body;

    if (!sellerId || !productId || !title || price_cents === undefined || !qty) {
      console.log('❌ Datos faltantes:', { sellerId, productId, title, price_cents, qty });
      return new Response(JSON.stringify({
        success: false,
        error: 'sellerId, productId, title, price_cents y qty son requeridos',
        received: body
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Buscar carrito existente para este usuario y vendedor
    const { data: existingCart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('seller_id', sellerId)
      .single();

    let cartId: string;

    if (cartError && cartError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error buscando carrito:', cartError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error buscando carrito: ' + cartError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!existingCart) {
      // Crear nuevo carrito
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: user.id,
          seller_id: sellerId
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creando carrito:', createError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error creando carrito: ' + createError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }

      cartId = newCart.id;
    } else {
      cartId = existingCart.id;
    }

    // Buscar item existente en el carrito
    const { data: existingItem, error: itemError } = await supabase
      .from('cart_items')
      .select('id, qty')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .single();

    if (itemError && itemError.code !== 'PGRST116') {
      console.error('Error buscando item del carrito:', itemError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error buscando item: ' + itemError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (existingItem) {
      // Actualizar cantidad existente
      const newQty = existingItem.qty + qty;
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ qty: newQty })
        .eq('id', existingItem.id);

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
    } else {
      // Insertar nuevo item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          title: title,
          price_cents: Math.round(price_cents),
          qty: qty
        });

      if (insertError) {
        console.error('Error insertando item:', insertError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error agregando item: ' + insertError.message
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
      .eq('cart_id', cartId);

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
      message: 'Producto agregado al carrito',
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