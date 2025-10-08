import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);
import { notifyDeliveryNewOffer } from '../../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, sellerId, pickupAddress, deliveryAddress, notes } = await request.json();

    if (!orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener información de la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!orders_user_id_fkey(name, phone),
        seller:profiles!orders_seller_id_fkey(name, phone)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Orden no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener couriers disponibles (status = 'active')
    const { data: availableCouriers, error: couriersError } = await supabase
      .from('couriers')
      .select('*')
      .eq('status', 'active');

    if (couriersError) {
      throw couriersError;
    }

    if (!availableCouriers || availableCouriers.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay repartidores disponibles'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Seleccionar courier aleatorio
    const randomCourier = availableCouriers[Math.floor(Math.random() * availableCouriers.length)];
    
    // Crear oferta de delivery para el courier seleccionado
    const { error: insertError } = await supabase
      .from('delivery_offers')
      .insert({
        order_id: orderId,
        courier_id: randomCourier.user_id,
        status: 'pending',
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        notes: notes,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutos
      });

    if (insertError) {
      throw insertError;
    }

    // Actualizar estado de la orden
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'delivery_requested',
        delivery_requested_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // Enviar notificación WhatsApp solo al courier seleccionado
    try {
      if (randomCourier.phone) {
        await notifyDeliveryNewOffer(
          randomCourier.phone,
          orderId,
          randomCourier.name || 'Repartidor'
        );
      }
    } catch (whatsappError) {
      console.error('Error enviando notificación WhatsApp:', whatsappError);
      // No fallar la operación por errores de WhatsApp
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Delivery solicitado. Courier ${randomCourier.name} notificado.`,
      courierId: randomCourier.user_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error solicitando delivery:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};