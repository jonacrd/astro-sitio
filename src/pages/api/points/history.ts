import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, url }) => {
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

    // Obtener parámetros de consulta
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Obtener historial de puntos del usuario
    const { data: historyData, error: historyError } = await supabase
      .from('points_history')
      .select(`
        id,
        points_earned,
        points_spent,
        transaction_type,
        description,
        created_at,
        seller:profiles!points_history_seller_id_fkey(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (historyError) {
      console.error('Error obteniendo historial:', historyError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo historial: ' + historyError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Formatear datos
    const formattedHistory = historyData?.map(item => ({
      id: item.id,
      points_earned: item.points_earned || 0,
      points_spent: item.points_spent || 0,
      transaction_type: item.transaction_type,
      description: item.description,
      created_at: item.created_at,
      seller_name: item.seller?.name || 'Vendedor'
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      history: formattedHistory,
      pagination: {
        limit,
        offset,
        total: formattedHistory.length
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/points/history:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
