import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Probando variables de entorno...');
    
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabaseService = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    return new Response(JSON.stringify({
      success: true,
      environment: {
        supabaseUrl: supabaseUrl ? '✅ Configurado' : '❌ No configurado',
        supabaseAnon: supabaseAnon ? '✅ Configurado' : '❌ No configurado',
        supabaseService: supabaseService ? '✅ Configurado' : '❌ No configurado',
        urlValue: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'No configurado',
        anonValue: supabaseAnon ? supabaseAnon.substring(0, 30) + '...' : 'No configurado',
        serviceValue: supabaseService ? supabaseService.substring(0, 30) + '...' : 'No configurado'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en prueba de variables:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


