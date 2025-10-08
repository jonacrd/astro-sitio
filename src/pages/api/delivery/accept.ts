import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);
import { notifyDeliveryStatus, notifyBuyerDeliveryStatus } from '../../../server/whatsapp-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { offerId } = await request.json();

    if (!offerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'offerId es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener la oferta
    const { data: offer, error: offerError } = await supabase
      .from('delivery_offers')
      .select(`
        *,
        order:orders!delivery_offers_order_id_fkey(
          *,
          buyer:profiles!orders_user_id_fkey(name, phone),
          seller:profiles!orders_seller_id_fkey(name, phone)
        )
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Oferta no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar estado de la oferta
    const { error: updateError } = await supabase
      .from('delivery_offers')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', offerId);

    if (updateError) {
      throw updateError;
    }

    // Actualizar estado de la orden
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: 'delivery_assigned',
        delivery_assigned_at: new Date().toISOString()
      })
      .eq('id', offer.order_id);

    if (orderError) {
      throw orderError;
    }

    // Enviar notificaciones WhatsApp
    try {
      // Notificar al vendedor
      if (offer.order.seller?.phone) {
        await notifyDeliveryStatus(
          offer.order.seller.phone,
          'delivery_assigned',
          offer.order_id,
          offer.order.seller.name || 'Vendedor'
        );
      }

      // Notificar al comprador
      if (offer.order.buyer?.phone) {
        await notifyBuyerDeliveryStatus(
          offer.order.buyer.phone,
          'delivery_assigned',
          offer.order_id,
          offer.order.buyer.name || 'Cliente'
        );
      }
    } catch (whatsappError) {
      console.error('Error enviando notificaciones WhatsApp:', whatsappError);
      // No fallar la operación por errores de WhatsApp
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Oferta aceptada exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error aceptando oferta:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
