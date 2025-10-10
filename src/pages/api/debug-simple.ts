import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Verificar variables de entorno
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabaseService = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    return new Response(JSON.stringify({
      success: true,
      message: 'Endpoint funcionando',
      env: {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseAnon: !!supabaseAnon,
        hasSupabaseService: !!supabaseService,
        supabaseUrlLength: supabaseUrl?.length || 0,
        supabaseAnonLength: supabaseAnon?.length || 0,
        supabaseServiceLength: supabaseService?.length || 0
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error en endpoint simple',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
