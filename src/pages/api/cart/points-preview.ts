import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url, request }) => {
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
    const sellerId = url.searchParams.get('sellerId');
    
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

    if (!sellerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'sellerId es requerido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener carrito del usuario
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('seller_id', sellerId)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo carrito: ' + cartError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    let totalCents = 0;
    let pointsEarned = 0;
    let tierInfo = null;

    if (cart) {
      // Calcular total del carrito
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('qty, price_cents')
        .eq('cart_id', cart.id);

      if (itemsError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Error obteniendo items del carrito: ' + itemsError.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }

      totalCents = cartItems?.reduce((sum, item) => sum + (item.qty * item.price_cents), 0) || 0;

      // Verificar sistema de recompensas del vendedor
      const { data: rewardsConfig, error: rewardsError } = await supabase
        .from('seller_rewards_config')
        .select('is_active, minimum_purchase_cents')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .single();

      if (!rewardsError && rewardsConfig && totalCents >= rewardsConfig.minimum_purchase_cents) {
        // Determinar nivel de recompensa
        const { data: rewardTier, error: tierError } = await supabase
          .from('seller_reward_tiers')
          .select('tier_name, points_multiplier')
          .eq('seller_id', sellerId)
          .eq('is_active', true)
          .lte('minimum_purchase_cents', totalCents)
          .order('minimum_purchase_cents', { ascending: false })
          .limit(1)
          .single();

        if (!tierError && rewardTier) {
          const multiplier = rewardTier.points_multiplier || 1.0;
          pointsEarned = Math.floor((totalCents * multiplier) / 100000); // 100000 centavos = $1,000
          tierInfo = {
            name: rewardTier.tier_name,
            multiplier: multiplier
          };
        } else {
          // Nivel básico (Bronce)
          pointsEarned = Math.floor(totalCents / 100000);
          tierInfo = {
            name: 'Bronce',
            multiplier: 1.0
          };
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalCents,
      pointsEarned,
      tierInfo,
      rewardsActive: !!tierInfo
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/cart/points-preview:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};









