import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuración de Supabase faltante'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parsear el cuerpo de la petición
    const body = await request.json();
    const { orderId, pointsToUse, sellerId } = body;

    if (!orderId || !pointsToUse || !sellerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId, pointsToUse y sellerId son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('🎯 Redimiendo puntos:', { orderId, pointsToUse, sellerId });

    // Verificar que el pedido existe y está en estado válido para redimir puntos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, total_cents, status, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el vendedor coincide
    if (order.seller_id !== sellerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El pedido no pertenece a este vendedor'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el pedido está en estado válido para aplicar descuentos
    if (order.status !== 'placed' && order.status !== 'seller_confirmed') {
      return new Response(JSON.stringify({
        success: false,
        error: 'El pedido no está en estado válido para aplicar descuentos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el vendedor tiene sistema de recompensas activo
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('is_active, points_per_peso')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .single();

    if (configError || !rewardsConfig) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El vendedor no tiene sistema de recompensas activo'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular puntos disponibles del usuario para este vendedor
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', order.user_id)
      .eq('seller_id', sellerId)
      .single();

    if (pointsError || !userPoints) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se encontraron puntos del usuario para este vendedor'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el usuario tiene suficientes puntos
    if (userPoints.points < pointsToUse) {
      return new Response(JSON.stringify({
        success: false,
        error: `Puntos insuficientes. Disponibles: ${userPoints.points}, Solicitados: ${pointsToUse}`
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular descuento (1 punto = 35 pesos, basado en points_per_peso)
    const pointsValuePerPeso = rewardsConfig.points_per_peso; // 0.0286 = 1/35
    const pesosPerPoint = Math.round(1 / pointsValuePerPeso); // 35 pesos por punto
    const discountCents = pointsToUse * pesosPerPoint * 100; // Convertir a centavos

    // Verificar que el descuento no sea mayor al total del pedido
    if (discountCents >= order.total_cents) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El descuento no puede ser mayor o igual al total del pedido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que no haya una redención previa para este pedido
    const { data: existingRedemption, error: redemptionError } = await supabase
      .from('point_redemptions')
      .select('id, status')
      .eq('order_id', orderId)
      .single();

    if (redemptionError && redemptionError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return new Response(JSON.stringify({
        success: false,
        error: 'Error verificando redenciones previas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (existingRedemption && existingRedemption.status === 'applied') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ya se ha aplicado un descuento con puntos a este pedido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Crear o actualizar registro de redención
    const redemptionData = {
      user_id: order.user_id,
      seller_id: sellerId,
      order_id: orderId,
      points_used: pointsToUse,
      discount_cents: discountCents,
      status: 'applied',
      applied_at: new Date().toISOString()
    };

    let redemptionResult;
    if (existingRedemption) {
      // Actualizar redención existente
      const { data, error } = await supabase
        .from('point_redemptions')
        .update(redemptionData)
        .eq('id', existingRedemption.id)
        .select()
        .single();

      if (error) throw error;
      redemptionResult = data;
    } else {
      // Crear nueva redención
      const { data, error } = await supabase
        .from('point_redemptions')
        .insert(redemptionData)
        .select()
        .single();

      if (error) throw error;
      redemptionResult = data;
    }

    // Actualizar total del pedido
    const newTotalCents = order.total_cents - discountCents;
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ total_cents: newTotalCents })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Error actualizando total del pedido:', orderUpdateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando total del pedido'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Descontar puntos del usuario
    const newPointsBalance = userPoints.points - pointsToUse;
    const { error: pointsUpdateError } = await supabase
      .from('user_points')
      .update({ points: newPointsBalance })
      .eq('user_id', order.user_id)
      .eq('seller_id', sellerId);

    if (pointsUpdateError) {
      console.error('Error actualizando puntos del usuario:', pointsUpdateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando puntos del usuario'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Registrar en historial de puntos
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: order.user_id,
        seller_id: sellerId,
        order_id: orderId,
        points_spent: pointsToUse,
        transaction_type: 'spent',
        description: `Puntos canjeados por descuento de $${(discountCents / 100).toLocaleString('es-CL')}`
      });

    if (historyError) {
      console.warn('Error registrando en historial:', historyError);
      // No fallar la operación por esto
    }

    // Crear notificación para el comprador
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: order.user_id,
        type: 'points_redeemed',
        title: 'Puntos canjeados',
        message: `Has canjeado ${pointsToUse} puntos por un descuento de $${(discountCents / 100).toLocaleString('es-CL')} en tu pedido #${orderId.slice(0, 8)}`,
        order_id: orderId
      });

    if (notificationError) {
      console.warn('Error creando notificación:', notificationError);
      // No fallar la operación por esto
    }

    console.log('✅ Puntos redimidos exitosamente:', {
      redemptionId: redemptionResult.id,
      pointsUsed: pointsToUse,
      discountCents,
      newTotalCents,
      newPointsBalance
    });

    return new Response(JSON.stringify({
      success: true,
      redemption_id: redemptionResult.id,
      points_used: pointsToUse,
      discount_cents: discountCents,
      new_total_cents: newTotalCents,
      new_points_balance: newPointsBalance,
      pesos_per_point: pesosPerPoint,
      message: `Descuento de $${(discountCents / 100).toLocaleString('es-CL')} aplicado exitosamente`
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en redeem points:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

// Endpoint para obtener información de redención disponible
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const orderId = url.searchParams.get('orderId');
    const sellerId = url.searchParams.get('sellerId');

    if (!orderId || !sellerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId y sellerId son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener información del pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, total_cents, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener configuración de recompensas del vendedor
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('is_active, points_per_peso')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .single();

    if (configError || !rewardsConfig) {
      return new Response(JSON.stringify({
        success: false,
        can_redeem: false,
        reason: 'El vendedor no tiene sistema de recompensas activo'
      }), { 
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener puntos disponibles del usuario
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', order.user_id)
      .eq('seller_id', sellerId)
      .single();

    if (pointsError || !userPoints || userPoints.points <= 0) {
      return new Response(JSON.stringify({
        success: true,
        can_redeem: false,
        reason: 'No tienes puntos disponibles para este vendedor',
        available_points: userPoints?.points || 0
      }), { 
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar redención previa
    const { data: existingRedemption, error: redemptionError } = await supabase
      .from('point_redemptions')
      .select('id, status, points_used, discount_cents')
      .eq('order_id', orderId)
      .single();

    if (redemptionError && redemptionError.code !== 'PGRST116') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error verificando redenciones previas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular información de redención
    const pointsValuePerPeso = rewardsConfig.points_per_peso;
    const pesosPerPoint = Math.round(1 / pointsValuePerPeso);
    const maxDiscountCents = Math.floor(order.total_cents * 0.5); // Máximo 50% del pedido
    const maxPointsUsable = Math.floor(maxDiscountCents / (pesosPerPoint * 100));
    const actualMaxPoints = Math.min(userPoints.points, maxPointsUsable);

    return new Response(JSON.stringify({
      success: true,
      can_redeem: true,
      available_points: userPoints.points,
      pesos_per_point: pesosPerPoint,
      order_total_cents: order.total_cents,
      max_points_usable: actualMaxPoints,
      max_discount_cents: actualMaxPoints * pesosPerPoint * 100,
      existing_redemption: existingRedemption || null
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en GET redeem info:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

