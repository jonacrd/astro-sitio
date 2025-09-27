import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Obtener todos los perfiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, phone, is_seller, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo perfiles: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Perfiles obtenidos exitosamente',
      count: profiles?.length || 0,
      profiles: profiles || []
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { userId, action } = await request.json();

    if (action === 'make_seller') {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('id', userId);

      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Error actualizando perfil: ' + error.message
        }), { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Usuario convertido a vendedor exitosamente'
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Acción no válida'
    }), { 
      status: 400,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};



