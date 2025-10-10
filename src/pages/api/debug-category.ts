import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase-config';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const supabase = createSupabaseServerClient();
    
    // Verificar conexión
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (testError) {
      return new Response(JSON.stringify({ 
        error: 'Error de conexión a Supabase',
        details: testError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar productos por categoría
    const categories = ['postres', 'minimarkets', 'medicinas', 'carniceria', 'servicios', 'mascotas', 'ninos'];
    const categoryStats = {};

    for (const category of categories) {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, category')
        .eq('category', category);

      categoryStats[category] = {
        count: products?.length || 0,
        error: error?.message || null
      };
    }

    // Verificar vendedores
    const { data: vendors, error: vendorsError } = await supabase
      .from('profiles')
      .select('id, name, is_active');

    return new Response(JSON.stringify({
      success: true,
      connection: 'OK',
      vendors: {
        total: vendors?.length || 0,
        active: vendors?.filter(v => v.is_active).length || 0,
        error: vendorsError?.message || null
      },
      categories: categoryStats,
      sampleProducts: await supabase
        .from('products')
        .select('id, title, category, price_cents')
        .limit(5)
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
