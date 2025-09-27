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
    const { sellerId, payment_method, delivery_address } = body;

    console.log('🔍 Checkout recibido:', { sellerId, payment_method, delivery_address });

    if (!sellerId || !payment_method || !delivery_address) {
      return new Response(JSON.stringify({
        success: false,
        error: 'sellerId, payment_method y delivery_address son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Validar datos de domicilio
    if (!delivery_address.fullName || !delivery_address.phone || 
        !delivery_address.address || !delivery_address.city || 
        !delivery_address.state || !delivery_address.zipCode) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Todos los campos de dirección son obligatorios'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener carrito del usuario para este vendedor
    console.log('🔍 Buscando carrito para user_id:', user.id, 'seller_id:', sellerId);
    
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        id,
        seller_id,
        seller:profiles!carts_seller_id_fkey(
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('seller_id', sellerId)
      .single();

    console.log('📦 Resultado de búsqueda de carrito:', { cart, cartError });

    if (cartError || !cart) {
      console.error('❌ Error obteniendo carrito:', cartError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Carrito no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener items del carrito
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (itemsError || !cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay productos en el carrito'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular total
    const totalCents = cartItems.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

    console.log('💰 Total calculado:', { totalCents, itemCount });

    // Usar la nueva función con expiración para crear el pedido
    const { data: orderResult, error: orderError } = await supabase.rpc('place_order_with_expiration', {
      p_user_id: user.id,
      p_seller_id: sellerId,
      p_payment_method: payment_method,
      p_expiration_minutes: 15 // 15 minutos de expiración
    });

    if (orderError) {
      console.error('Error creando orden:', orderError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error creando orden: ' + orderError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!orderResult.success) {
      console.error('Error en función place_order_with_expiration:', orderResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error creando orden: ' + orderResult.error
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const orderId = orderResult.order_id;
    console.log('✅ Orden creada:', orderId);

    // Los items de la orden ya se crearon en la función place_order_with_expiration
    console.log('✅ Items de orden creados automáticamente');

    // El carrito ya se limpió en la función place_order_with_expiration
    console.log('✅ Carrito limpiado automáticamente');

    // Agregar puntos al usuario (opcional)
    const pointsToAdd = Math.floor(totalCents / 100); // 1 punto por cada $1
    if (pointsToAdd > 0) {
      const { error: pointsError } = await supabase
        .from('user_points')
        .upsert({
          user_id: user.id,
          points: pointsToAdd,
          source: 'purchase',
          order_id: orderId
        }, { onConflict: 'user_id' });

      if (pointsError) {
        console.error('Error agregando puntos:', pointsError);
        // No fallar la operación por esto
      }
    }

    console.log('✅ Checkout completado exitosamente');

    return new Response(JSON.stringify({
      success: true,
      data: {
        orderId: orderId,
        totalCents,
        itemCount,
        pointsAdded: pointsToAdd,
        sellerName: cart.seller.name
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/checkout:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};