import type { APIRoute } from "astro";
import { createClient } from '@supabase/supabase-js';
import { notifySellerNewOrder } from '../../../server/whatsapp-automation';

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { customerName, customerEmail, deliveryAddress, paymentMethod, orderNotes, transferProof } = body;

    console.log('🛒 Checkout recibido:', { customerName, customerEmail, deliveryAddress, paymentMethod, orderNotes, hasTransferProof: !!transferProof });

    if (!customerName || !customerEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nombre y email son requeridos",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Obtener token de autorización
    const authHeader = context.request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado - Token requerido'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Configurar Supabase
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar usuario autenticado
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no autenticado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('👤 Usuario autenticado:', user.email);

    // Obtener items del carrito desde el body de la request
    const cartItems = body.cartItems || [
      {
        productId: '1',
        title: 'Producto de Prueba',
        priceCents: 5000,
        quantity: 1,
        sellerId: 'seller_1',
        sellerName: 'Vendedor de Prueba'
      }
    ];

    // Calcular total con validación
    const totalCents = cartItems.reduce((sum, item) => {
      const price = Number(item.priceCents) || 0;
      const quantity = Number(item.quantity) || 0;
      const itemTotal = price * quantity;
      console.log(`💰 Item: ${item.title}, Precio: ${price}, Cantidad: ${quantity}, Subtotal: ${itemTotal}`);
      return sum + itemTotal;
    }, 0);
    
    const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    console.log('📦 Creando orden:', { orderCode, totalCents, cartItems });
    console.log('💰 Total calculado:', totalCents);
    
    // Validar que el total sea válido
    if (!totalCents || totalCents <= 0) {
      console.error('❌ Total inválido:', totalCents);
      return new Response(JSON.stringify({
        success: false,
        error: 'Total del carrito inválido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Usar el ID del usuario autenticado
    const clientUuid = user.id; // Usuario autenticado
    const sellerUuid = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // Diego Ramírez (vendedor activo)
    
    console.log('👤 Usuario ID:', clientUuid);
    console.log('🏪 Vendedor ID:', sellerUuid);
    
    console.log('🎯 Verificando carrito existente o creando uno nuevo...');
    
    // 1. Verificar si ya existe un carrito para este usuario y vendedor
    const { data: existingCart, error: findError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', clientUuid)
      .eq('seller_id', sellerUuid)
      .single();

    let cart;
    
    if (existingCart) {
      // Usar carrito existente
      console.log('✅ Usando carrito existente:', existingCart.id);
      cart = existingCart;
      
      // Limpiar items existentes del carrito
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
        
      if (deleteError) {
        console.error('❌ Error limpiando carrito existente:', deleteError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error limpiando carrito existente: ' + deleteError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }
      
      console.log('✅ Carrito existente limpiado');
    } else {
      // Crear nuevo carrito
      const { data: newCart, error: cartError } = await supabase
        .from('carts')
        .insert({
          user_id: clientUuid,
          seller_id: sellerUuid,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (cartError) {
        console.error('❌ Error creando carrito:', cartError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error creando carrito: ' + cartError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }

      console.log('✅ Carrito nuevo creado:', newCart.id);
      cart = newCart;
    }

    // 2. Agregar items al carrito temporal
    console.log('📝 Items a procesar:', cartItems.length);
    
    for (const item of cartItems) {
      console.log('🔍 Procesando item:', {
        id: item.id || item.productId,
        title: item.title,
        quantity: item.quantity || item.qty,
        priceCents: item.priceCents
      });
      
      const { error: itemError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: item.id || item.productId, // Usar id o productId
          title: item.title,
          price_cents: item.priceCents,
          qty: item.quantity || item.qty || 1 // Usar quantity o qty
        });

      if (itemError) {
        console.error('❌ Error agregando item al carrito:', itemError.message, itemError);
        // No continuar si falla, lanzar error
        return new Response(JSON.stringify({
          success: false,
          error: 'Error agregando items al carrito: ' + itemError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      } else {
        console.log('✅ Item agregado al carrito:', item.title);
      }
    }
    
    console.log('✅ Todos los items agregados al carrito temporal');

    // 3. Usar la función place_order que otorga puntos automáticamente
    const { data: orderResult, error: orderError } = await supabase
      .rpc('place_order', {
        p_user_id: clientUuid,
        p_seller_id: sellerUuid,
        p_payment_method: paymentMethod || 'cash',
        p_delivery_address: deliveryAddress || {},
        p_delivery_notes: orderNotes || '',
        p_transfer_proof: transferProof || null
      });

    if (orderError) {
      console.error('❌ Error en función place_order:', orderError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error creando la orden: ' + orderError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!orderResult.success) {
      console.error('❌ Error en resultado de place_order:', orderResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error en la orden: ' + orderResult.error
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('✅ Orden creada con puntos:', orderResult);
    console.log('🎯 Puntos otorgados:', orderResult.pointsAdded);

    // Los items ya fueron creados por la función place_order, no necesitamos crearlos de nuevo
    console.log('✅ Items de la orden ya fueron creados por place_order');

    // 📱 ACTUALIZAR TELÉFONO DEL CLIENTE (si proporcionó uno)
    if (deliveryAddress?.contact) {
      console.log('📱 Actualizando teléfono del cliente:', deliveryAddress.contact);
      const { error: phoneError } = await supabase
        .from('profiles')
        .update({ phone: deliveryAddress.contact })
        .eq('id', clientUuid);
      
      if (phoneError) {
        console.error('⚠️ Error actualizando teléfono del cliente:', phoneError);
      } else {
        console.log('✅ Teléfono del cliente actualizado');
      }
    }

    // 📱 ENVIAR WHATSAPP AL VENDEDOR (automático)
    try {
      console.log('📱 AUTOMÁTICO: Enviando WhatsApp al vendedor sobre pedido:', orderResult.orderId);
      await notifySellerNewOrder(orderResult.orderId, sellerUuid);
      console.log('✅ AUTOMÁTICO: WhatsApp enviado al vendedor');
    } catch (waErr) {
      console.error('❌ WhatsApp notify error (no bloquea):', waErr);
    }

    // Crear notificación para el vendedor (usando la estructura existente si existe)
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: sellerUuid, // UUID existente para vendedor
        type: 'new_order',
        title: 'Nueva Orden Recibida',
        message: `Tienes una nueva orden #${orderCode} de ${customerName}`,
        data: {
          orderId: orderResult.orderId,
          orderCode: orderCode,
          customerName: customerName,
          totalCents: totalCents
        }
      });

    if (notificationError) {
      console.log('⚠️ Tabla notifications no existe o tiene estructura diferente:', notificationError.message);
      // Continuar sin notificación por ahora
    } else {
      console.log('🔔 Notificación creada para el vendedor');
    }

    // 📱 ENVIAR NOTIFICACIÓN PUSH AL VENDEDOR con OneSignal
    try {
      console.log('📬 Intentando enviar notificación push al vendedor:', sellerUuid);
      
      const onesignalAppId = '270896d8-ba2e-40bc-8f3b-c1e6efd258a1';
      const onesignalRestKey = import.meta.env.ONESIGNAL_REST_API_KEY || '';

      if (onesignalRestKey) {
        const notificationPayload = {
          app_id: onesignalAppId,
          include_aliases: {
            external_id: [sellerUuid]
          },
          target_channel: 'push',
          headings: { en: '🛒 ¡Nuevo Pedido Recibido!' },
          contents: { en: `Nueva orden #${orderCode} de ${customerName}` },
          data: {
            type: 'new_order',
            orderId: orderResult.orderId,
            orderCode,
            url: `/vendedor/pedidos/${orderResult.orderId}`,
            timestamp: new Date().toISOString()
          },
          url: `/vendedor/pedidos/${orderResult.orderId}`,
          chrome_web_icon: '/favicon.svg',
          firefox_icon: '/favicon.svg',
          chrome_web_badge: '/favicon.svg'
        };

        console.log('📦 Payload OneSignal:', JSON.stringify(notificationPayload, null, 2));

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
          console.log('✅ Notificación push OneSignal enviada:', result);
        } else {
          console.error('❌ Error enviando notificación push:', result);
        }
      } else {
        console.warn('⚠️ ONESIGNAL_REST_API_KEY no configurada');
      }
    } catch (pushError) {
      console.error('⚠️ Error enviando notificación push (no crítico):', pushError);
      // No fallar el checkout si falla la notificación push
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderCode: orderCode,
        totalCents: totalCents,
        message: "Orden creada exitosamente",
        orderId: orderResult.orderId,
        pointsAdded: orderResult.pointsAdded || 0,
        pointsMessage: orderResult.pointsAdded > 0 ? 
          `¡Felicidades! Has ganado ${orderResult.pointsAdded} puntos por tu compra` : 
          'No se otorgaron puntos para esta compra'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("❌ Error during checkout:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error al procesar la orden",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};