import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Probando conexión a Supabase...');
    
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔑 Variables:', {
      url: supabaseUrl ? '✅ Presente' : '❌ Faltante',
      serviceKey: supabaseServiceKey ? '✅ Presente' : '❌ Faltante',
      urlValue: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'No configurado'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        error: 'Variables de entorno faltantes',
        url: !!supabaseUrl,
        serviceKey: !!supabaseServiceKey
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Cliente Supabase creado');

    // Prueba simple: contar productos
    console.log('🔍 Probando consulta simple...');
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title')
      .limit(3);

    console.log('📊 Resultado:', {
      products: products?.length || 0,
      error: error?.message || null,
      errorCode: error?.code || null
    });

    if (error) {
      return new Response(JSON.stringify({ 
        error: 'Error en consulta de prueba',
        details: error.message,
        code: error.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Conexión a Supabase funcionando',
      productsFound: products?.length || 0,
      sampleProducts: products || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en prueba de conexión:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
