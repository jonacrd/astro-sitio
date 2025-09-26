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

    // Obtener puntos del usuario
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points, seller_id, seller:profiles(name)')
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

    // Calcular total de puntos
    const totalPoints = userPoints?.reduce((sum, item) => sum + item.points, 0) || 0;

    // Obtener historial de puntos
    const { data: history, error: historyError } = await supabase
      .from('points_history')
      .select(`
        id,
        points_earned,
        points_spent,
        transaction_type,
        description,
        created_at,
        seller:profiles(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({
      success: true,
      totalPoints,
      pointsBySeller: userPoints || [],
      history: history || []
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/user/points:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
