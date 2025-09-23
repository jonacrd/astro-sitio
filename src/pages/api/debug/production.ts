import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Verificar variables de entorno
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    const envStatus = {
      PUBLIC_SUPABASE_URL: {
        exists: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT_SET',
        full: supabaseUrl
      },
      PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!supabaseAnonKey,
        value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT_SET'
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!supabaseServiceKey,
        value: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT_SET'
      }
    };

    // Verificar si es producción
    const isProduction = import.meta.env.PROD;
    const nodeEnv = import.meta.env.NODE_ENV;
    const vercelEnv = import.meta.env.VERCEL_ENV;

    return new Response(JSON.stringify({
      success: true,
      environment: {
        isProduction,
        nodeEnv,
        vercelEnv,
        platform: import.meta.env.PLATFORM
      },
      envVars: envStatus,
      timestamp: new Date().toISOString(),
      message: 'Debug endpoint funcionando'
    }), {
      headers: { 
        'content-type': 'application/json',
        'access-control-allow-origin': '*'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
