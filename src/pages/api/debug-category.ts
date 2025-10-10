import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    // Usar el mismo patrón que otros endpoints estables
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      return new Response(JSON.stringify({ 
        error: 'Variables de entorno de Supabase faltantes',
        details: 'PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY no configuradas'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);
    
    // Verificar conexión básica
    const { data: testProducts, error: testError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(5);

    if (testError) {
      return new Response(JSON.stringify({ 
        error: 'Error de conexión a Supabase',
        details: testError.message,
        code: testError.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar vendedores
    const { data: vendors, error: vendorsError } = await supabase
      .from('profiles')
      .select('id, name, is_active')
      .limit(10);

    // Contar productos por categoría
    const categories = ['postres', 'minimarkets', 'medicinas', 'carniceria', 'servicios', 'mascotas', 'ninos'];
    const categoryStats = {};

    for (const category of categories) {
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('category', category);

      categoryStats[category] = {
        count: products?.length || 0,
        error: error?.message || null
      };
    }

    return new Response(JSON.stringify({
      success: true,
      connection: 'OK',
      vendors: {
        total: vendors?.length || 0,
        active: vendors?.filter(v => v.is_active).length || 0,
        error: vendorsError?.message || null
      },
      categories: categoryStats,
      sampleProducts: testProducts || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error interno',
      details: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
