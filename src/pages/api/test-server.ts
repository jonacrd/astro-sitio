import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Probando servidor básico...');
    
    // Verificar variables de entorno
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔑 Variables de entorno:', {
      url: supabaseUrl ? '✅ Presente' : '❌ Faltante',
      anon: supabaseAnon ? '✅ Presente' : '❌ Faltante',
      urlValue: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'No configurado',
      anonValue: supabaseAnon ? supabaseAnon.substring(0, 20) + '...' : 'No configurado'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: supabaseUrl ? '✅ Configurado' : '❌ No configurado',
        supabaseAnon: supabaseAnon ? '✅ Configurado' : '❌ No configurado',
        nodeEnv: import.meta.env.NODE_ENV || 'desarrollo'
      },
      categories: [
        'restaurantes',
        'minimarkets', 
        'medicinas',
        'postres',
        'carniceria',
        'servicios',
        'mascotas',
        'ninos'
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en prueba de servidor:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


