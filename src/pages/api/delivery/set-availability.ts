import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request }) => {
  try {
    const { courierId, status } = await request.json();

    if (!courierId || !status) {
      return new Response(JSON.stringify({
        success: false,
        error: 'courierId y status son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar estado de disponibilidad del courier
    const { error } = await supabase
      .from('couriers')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', courierId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Estado actualizado a ${status}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error actualizando disponibilidad:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
