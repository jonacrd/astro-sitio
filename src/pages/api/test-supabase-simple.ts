import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Iniciando prueba simple de Supabase...');
    
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔑 Variables de entorno:', {
      url: supabaseUrl ? '✅ Presente' : '❌ Faltante',
      anon: supabaseAnon ? '✅ Presente' : '❌ Faltante'
    });

    if (!supabaseUrl || !supabaseAnon) {
      return new Response(JSON.stringify({ 
        error: 'Variables de entorno faltantes',
        url: !!supabaseUrl,
        anon: !!supabaseAnon
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);
    console.log('✅ Cliente Supabase creado');

    // Prueba simple: contar productos
    console.log('🔍 Probando consulta simple...');
    const { data: products, error } = await supabase
      .from('products')
      .select('id, category')
      .limit(5);

    console.log('📊 Resultado de prueba:', {
      productsFound: products?.length || 0,
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

    // Prueba de categorías disponibles
    const categories = Array.from(new Set(products?.map(p => p.category) || []));

    return new Response(JSON.stringify({
      success: true,
      message: 'Conexión a Supabase funcionando',
      productsFound: products?.length || 0,
      categoriesFound: categories,
      sampleProducts: products?.slice(0, 3) || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en prueba de Supabase:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
