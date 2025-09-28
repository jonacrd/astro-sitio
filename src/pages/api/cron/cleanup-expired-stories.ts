import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // Verificar que sea una llamada autorizada (opcional: agregar token de autorización)
    const authHeader = request.headers.get('authorization');
    const expectedToken = import.meta.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Iniciando limpieza de historias expiradas...');

    // 1. Marcar historias expiradas como inactivas
    const { data: expiredStories, error: expireError } = await supabase
      .rpc('expire_old_stories');

    if (expireError) {
      console.error('❌ Error marcando historias expiradas:', expireError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error marcando historias expiradas'
      }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`✅ Historias expiradas marcadas: ${expiredStories || 0}`);

    // 2. Obtener estadísticas de limpieza
    const { data: stats, error: statsError } = await supabase
      .from('stories')
      .select('status')
      .in('status', ['active', 'expired', 'deleted']);

    if (statsError) {
      console.warn('⚠️ Error obteniendo estadísticas:', statsError);
    }

    // Contar por estado
    const statsCount = stats?.reduce((acc, story) => {
      acc[story.status] = (acc[story.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 3. Limpiar vistas de historias expiradas (opcional)
    const { data: cleanedViews, error: viewsError } = await supabase
      .from('story_views')
      .delete()
      .in('story_id', 
        supabase
          .from('stories')
          .select('id')
          .eq('status', 'expired')
      );

    if (viewsError) {
      console.warn('⚠️ Error limpiando vistas:', viewsError);
    }

    // 4. Limpiar reacciones de historias expiradas (opcional)
    const { data: cleanedReactions, error: reactionsError } = await supabase
      .from('story_reactions')
      .delete()
      .in('story_id',
        supabase
          .from('stories')
          .select('id')
          .eq('status', 'expired')
      );

    if (reactionsError) {
      console.warn('⚠️ Error limpiando reacciones:', reactionsError);
    }

    // 5. Limpiar respuestas de historias expiradas (opcional)
    const { data: cleanedReplies, error: repliesError } = await supabase
      .from('story_replies')
      .delete()
      .in('story_id',
        supabase
          .from('stories')
          .select('id')
          .eq('status', 'expired')
      );

    if (repliesError) {
      console.warn('⚠️ Error limpiando respuestas:', repliesError);
    }

    console.log('🎉 Limpieza de historias completada');

    return new Response(JSON.stringify({
      success: true,
      message: 'Limpieza de historias completada',
      stats: {
        expired_stories: expiredStories || 0,
        total_active: statsCount.active || 0,
        total_expired: statsCount.expired || 0,
        total_deleted: statsCount.deleted || 0
      },
      cleaned: {
        views: cleanedViews?.length || 0,
        reactions: cleanedReactions?.length || 0,
        replies: cleanedReplies?.length || 0
      }
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en limpieza de historias:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

// También permitir POST para llamadas programadas
export const POST: APIRoute = async (context) => {
  return GET(context);
};
