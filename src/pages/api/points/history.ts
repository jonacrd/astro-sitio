import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno no configuradas');
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'userId es requerido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📊 Obteniendo historial de puntos para usuario:', userId);

    // Intentar obtener historial de puntos (con fallback)
    let history = [];
    try {
      const { data, error: historyError } = await supabase
        .from('points_history')
        .select(`
          id,
          seller_id,
          order_id,
          points_earned,
          points_spent,
          transaction_type,
          description,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (historyError) {
        console.warn('⚠️ Error obteniendo points_history, usando datos vacíos:', historyError);
        history = [];
      } else {
        history = data || [];
      }
    } catch (error) {
      console.warn('⚠️ Excepción obteniendo points_history, usando datos vacíos:', error);
      history = [];
    }

    // Formatear datos
    const formattedHistory = history?.map(entry => ({
      id: entry.id,
      seller_id: entry.seller_id,
      order_id: entry.order_id,
      points_earned: entry.points_earned,
      points_spent: entry.points_spent,
      transaction_type: entry.transaction_type,
      description: entry.description,
      created_at: entry.created_at,
      seller_name: 'Vendedor' // Simplificado por ahora
    })) || [];

    console.log(`✅ Historial obtenido: ${formattedHistory.length} transacciones`);

    return new Response(JSON.stringify({
      success: true,
      history: formattedHistory,
      count: formattedHistory.length,
      has_more: formattedHistory.length === limit
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en GET points/history:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};