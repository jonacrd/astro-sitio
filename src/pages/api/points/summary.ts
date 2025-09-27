import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const userId = url.searchParams.get('userId');

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

    console.log('📊 Obteniendo resumen de puntos para usuario:', userId);

    // Intentar obtener resumen de puntos por vendedor (con fallback)
    let summary = [];
    try {
      const { data, error: summaryError } = await supabase
        .from('user_points')
        .select(`
          seller_id,
          points
        `)
        .eq('user_id', userId)
        .gt('points', 0);

      if (summaryError) {
        console.warn('⚠️ Error obteniendo user_points, usando datos vacíos:', summaryError);
        summary = [];
      } else {
        summary = data || [];
      }
    } catch (error) {
      console.warn('⚠️ Excepción obteniendo user_points, usando datos vacíos:', error);
      summary = [];
    }

    // Intentar obtener estadísticas detalladas por vendedor (con fallback)
    let stats = [];
    try {
      const { data, error: statsError } = await supabase
        .from('points_history')
        .select(`
          seller_id,
          points_earned,
          points_spent,
          created_at
        `)
        .eq('user_id', userId);

      if (statsError) {
        console.warn('⚠️ Error obteniendo points_history, usando datos vacíos:', statsError);
        stats = [];
      } else {
        stats = data || [];
      }
    } catch (error) {
      console.warn('⚠️ Excepción obteniendo points_history, usando datos vacíos:', error);
      stats = [];
    }

    // Procesar estadísticas por vendedor
    const sellerStats = new Map();
    
    stats?.forEach(stat => {
      const sellerId = stat.seller_id;
      if (!sellerStats.has(sellerId)) {
        sellerStats.set(sellerId, {
          seller_id: sellerId,
          points_earned: 0,
          points_spent: 0,
          last_transaction: stat.created_at
        });
      }
      
      const current = sellerStats.get(sellerId);
      current.points_earned += stat.points_earned || 0;
      current.points_spent += stat.points_spent || 0;
      
      // Actualizar última transacción si es más reciente
      if (new Date(stat.created_at) > new Date(current.last_transaction)) {
        current.last_transaction = stat.created_at;
      }
    });

    // Combinar datos de resumen con estadísticas
    const formattedSummary = summary?.map(entry => {
      const stats = sellerStats.get(entry.seller_id) || {
        points_earned: 0,
        points_spent: 0,
        last_transaction: new Date().toISOString()
      };

      return {
        seller_id: entry.seller_id,
        seller_name: 'Vendedor', // Simplificado por ahora
        total_points: entry.points,
        points_earned: stats.points_earned,
        points_spent: stats.points_spent,
        last_transaction: stats.last_transaction
      };
    }) || [];

    // Ordenar por total de puntos descendente
    formattedSummary.sort((a, b) => b.total_points - a.total_points);

    console.log(`✅ Resumen obtenido: ${formattedSummary.length} vendedores con puntos`);

    return new Response(JSON.stringify({
      success: true,
      summary: formattedSummary,
      total_sellers: formattedSummary.length,
      total_points: formattedSummary.reduce((sum, seller) => sum + seller.total_points, 0)
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en GET points/summary:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
