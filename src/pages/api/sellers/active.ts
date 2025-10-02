import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
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
    
    // Obtener todos los vendedores activos
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        phone,
        email,
        is_seller,
        created_at
      `)
      .eq('is_seller', true)
      .order('created_at', { ascending: false });

    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo vendedores: ' + sellersError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`✅ Vendedores activos encontrados: ${sellers?.length || 0}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        sellers: sellers || [],
        total: sellers?.length || 0
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en endpoint de vendedores activos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};



