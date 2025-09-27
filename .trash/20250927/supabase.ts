import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    // Verificar variables de entorno
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas',
        env: {
          url: supabaseUrl ? '✅' : '❌',
          anonKey: supabaseAnonKey ? '✅' : '❌'
        }
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Probar conexión básica
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error de conexión a Supabase',
        details: error.message,
        env: {
          url: supabaseUrl,
          anonKey: supabaseAnonKey.substring(0, 20) + '...'
        }
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Conexión a Supabase exitosa',
      env: {
        url: supabaseUrl,
        anonKey: supabaseAnonKey.substring(0, 20) + '...'
      },
      test: {
        profilesTable: '✅ Accesible',
        count: data?.length || 0
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado',
      details: error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
