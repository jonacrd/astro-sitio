import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { notifySellerNewOrder } from '../../server/whatsapp-real';

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

    // 📱 ENVIAR NOTIFICACIÓN AL VENDEDOR con OneSignal
    try {
      const productName = cartItems[0]?.title || 'productos';
      const productCount = cartItems.length;
      const notificationBody = productCount > 1 
        ? `Tienes un nuevo pedido de ${productCount} productos` 
        : `Tienes un nuevo pedido de ${productName}`;

      // Enviar notificación usando OneSignal REST API
      const onesignalAppId = '270896d8-ba2e-40bc-8f3b-c1e6efd258a1';
      const onesignalRestKey = process.env.ONESIGNAL_REST_API_KEY || '';

      if (onesignalRestKey) {
        console.log('📬 Intentando enviar notificación al vendedor:', sellerId);
        
        const notificationPayload = {
          app_id: onesignalAppId,
          include_aliases: {
            external_id: [sellerId]
          },
          target_channel: 'push',
          headings: { en: '🛒 ¡Nuevo Pedido Recibido!' },
          contents: { en: notificationBody },
          data: {
            type: 'new_order',
            orderId,
            url: `/vendedor/pedidos/${orderId}`,
            timestamp: new Date().toISOString()
          },
          url: `/vendedor/pedidos/${orderId}`,
          chrome_web_icon: '/favicon.svg',
          firefox_icon: '/favicon.svg',
          chrome_web_badge: '/favicon.svg'
        };

        console.log('📦 Payload:', JSON.stringify(notificationPayload, null, 2));

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${onesignalRestKey}`
          },
          body: JSON.stringify(notificationPayload)
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Notificación OneSignal enviada:', result);
        } else {
          console.error('❌ Error enviando notificación:', result);
        }
      } else {
        console.warn('⚠️ ONESIGNAL_REST_API_KEY no configurada');
      }
    } catch (notifError) {
      console.error('Error enviando notificación al vendedor:', notifError);
      // No fallar el checkout si falla la notificación
    }

    // 📱 ENVIAR WHATSAPP AL VENDEDOR (seguro y no bloqueante)
    try {
      const appBaseUrl = process.env.APP_BASE_URL || 'https://astro-sitio.vercel.app';
      const confirmUrl = `${appBaseUrl}/dashboard/pedidos`;

      // Obtener teléfono y opt-in del vendedor
      const { data: seller } = await supabase
        .from('profiles')
        .select('phone, opt_in_whatsapp')
        .eq('id', sellerId)
        .single();

      // FORZAR WHATSAPP PARA PRUEBAS - SIEMPRE ENVIAR
      const testPhone = '+56962614851';
      await notifySellerNewOrder(testPhone, orderId);
      console.log('📱 WhatsApp enviado al vendedor (FORZADO):', testPhone);
      
      // Código original comentado para pruebas
      // if (seller?.phone && seller?.opt_in_whatsapp) {
      //   await notifySellerNewOrder(seller.phone, orderId);
      //   console.log('📱 WhatsApp enviado al vendedor:', seller.phone);
      // } else {
      //   console.log('⚠️ Vendedor sin teléfono o opt-in WhatsApp:', { 
      //     phone: seller?.phone, 
      //     opt_in: seller?.opt_in_whatsapp 
      //   });
      // }
    } catch (waErr) {
      console.error('WhatsApp notify error (no bloquea):', waErr);
    }

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