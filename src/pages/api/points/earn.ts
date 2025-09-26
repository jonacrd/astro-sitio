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
    const { orderId, sellerId, totalCents } = body;

    if (!orderId || !sellerId || !totalCents) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId, sellerId y totalCents son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar si el vendedor tiene sistema de puntos activado
    const { data: rewardsConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('is_active, minimum_purchase_cents, points_per_peso')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .single();

    if (configError || !rewardsConfig) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El vendedor no tiene sistema de puntos activado'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar compra mínima
    if (totalCents < rewardsConfig.minimum_purchase_cents) {
      return new Response(JSON.stringify({
        success: false,
        error: `Compra mínima para puntos: $${(rewardsConfig.minimum_purchase_cents / 100).toLocaleString('es-CL')}`
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular puntos a otorgar
    const pointsEarned = Math.floor(totalCents * rewardsConfig.points_per_peso);

    if (pointsEarned <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se pueden otorgar puntos para esta compra'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Registrar puntos en el historial
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: user.id,
        seller_id: sellerId,
        order_id: orderId,
        points_earned: pointsEarned,
        transaction_type: 'earned',
        description: `Puntos ganados por compra de $${(totalCents / 100).toLocaleString('es-CL')}`
      });

    if (historyError) {
      console.error('Error registrando puntos:', historyError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error registrando puntos: ' + historyError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      pointsEarned,
      message: `¡Ganaste ${pointsEarned} puntos por tu compra!`
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/points/earn:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
