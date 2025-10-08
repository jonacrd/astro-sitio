import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request }) => {
  try {
    // Buscar ofertas expiradas (más de 2 minutos)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: expiredOffers, error: fetchError } = await supabase
      .from('delivery_offers')
      .select('*')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredOffers || expiredOffers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No hay ofertas expiradas'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Marcar ofertas como expiradas
    const { error: updateError } = await supabase
      .from('delivery_offers')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (updateError) {
      throw updateError;
    }

    // Para cada oferta expirada, buscar otro courier disponible
    for (const expiredOffer of expiredOffers) {
      // Buscar otro courier disponible
      const { data: availableCouriers, error: couriersError } = await supabase
        .from('couriers')
        .select('*')
        .eq('status', 'active')
        .neq('user_id', expiredOffer.courier_id);

      if (couriersError || !availableCouriers || availableCouriers.length === 0) {
        console.log('No hay couriers alternativos disponibles');
        continue;
      }

      // Seleccionar courier aleatorio
      const randomCourier = availableCouriers[Math.floor(Math.random() * availableCouriers.length)];
      
      // Crear nueva oferta
      const { error: insertError } = await supabase
        .from('delivery_offers')
        .insert({
          order_id: expiredOffer.order_id,
          courier_id: randomCourier.user_id,
          status: 'pending',
          pickup_address: expiredOffer.pickup_address,
          delivery_address: expiredOffer.delivery_address,
          notes: expiredOffer.notes,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
        });

      if (insertError) {
        console.error('Error creando nueva oferta:', insertError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${expiredOffers.length} ofertas expiradas procesadas`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error procesando ofertas expiradas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
