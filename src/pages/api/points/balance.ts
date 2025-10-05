import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request }) => {
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

    // Obtener resumen de puntos del usuario
    const { data: pointsData, error: pointsError } = await supabase
      .from('points_history')
      .select('points_earned, points_spent')
      .eq('user_id', user.id);

    if (pointsError) {
      console.error('Error obteniendo puntos:', pointsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo puntos: ' + pointsError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Calcular resumen
    const totalEarned = pointsData?.reduce((sum, item) => sum + (item.points_earned || 0), 0) || 0;
    const totalSpent = pointsData?.reduce((sum, item) => sum + (item.points_spent || 0), 0) || 0;
    const availablePoints = totalEarned - totalSpent;

    return new Response(JSON.stringify({
      success: true,
      totalEarned,
      totalSpent,
      availablePoints,
      summary: {
        total_points: totalEarned,
        available_points: availablePoints,
        spent_points: totalSpent
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/points/balance:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};









