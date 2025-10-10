import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuración de Supabase faltante'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🕐 Ejecutando job de cancelación de pedidos expirados...');

    // Llamar a la función SQL para cancelar pedidos expirados
    const { data, error } = await supabase.rpc('cancel_expired_orders');

    if (error) {
      console.error('❌ Error cancelando pedidos expirados:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const cancelledCount = data || 0;

    console.log(`✅ Job completado: ${cancelledCount} pedidos cancelados`);

    return new Response(JSON.stringify({
      success: true,
      cancelled_count: cancelledCount,
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en job de cancelación:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

// También permitir POST para llamadas programáticas
export const POST = GET;








