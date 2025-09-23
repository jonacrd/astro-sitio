import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno de Supabase no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorización requerido'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Crear cliente con anon key para verificar autenticación
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
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
    const { sellerId, payment_method } = await request.json();

    if (!sellerId || !payment_method) {
      return new Response(JSON.stringify({
        success: false,
        error: 'sellerId y payment_method son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Crear cliente con service role key para llamar RPC
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Llamar a la función RPC place_order
    const { data, error } = await supabaseAdmin.rpc('place_order', {
      user_id: user.id,
      seller_id: sellerId,
      payment_method: payment_method
    });

    if (error) {
      console.error('Error en place_order RPC:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error procesando la orden: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!data) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se pudo procesar la orden'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // La función RPC debería devolver {orderId, totalCents, pointsAdded}
    return new Response(JSON.stringify({
      success: true,
      message: 'Orden procesada exitosamente',
      orderId: data.orderId || data.order_id,
      totalCents: data.totalCents || data.total_cents,
      pointsAdded: data.pointsAdded || data.points_added || 0
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error inesperado en checkout:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
