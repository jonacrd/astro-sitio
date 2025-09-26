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

    // Obtener datos del request
    const body = await request.json();
    const { config, tiers } = body;

    if (!config || !tiers) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuración y niveles son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 1. Guardar configuración principal
    const { error: configError } = await supabase
      .from('seller_rewards_config')
      .upsert({
        seller_id: user.id,
        is_active: Boolean(config.is_active), // Asegurar que sea boolean
        points_per_peso: config.points_per_peso,
        minimum_purchase_cents: config.minimum_purchase_cents
      });

    if (configError) {
      console.error('Error guardando configuración:', configError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error guardando configuración: ' + configError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 2. Guardar niveles de recompensa
    for (const tier of tiers) {
      const { error: tierError } = await supabase
        .from('seller_reward_tiers')
        .upsert({
          seller_id: user.id,
          tier_name: tier.tier_name,
          minimum_purchase_cents: tier.minimum_purchase_cents,
          points_multiplier: tier.points_multiplier,
          description: tier.description,
          is_active: Boolean(tier.is_active) // Asegurar que sea boolean
        });

      if (tierError) {
        console.error('Error guardando nivel:', tierError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Error guardando nivel: ' + tierError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Configuración guardada exitosamente'
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/rewards-config:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
