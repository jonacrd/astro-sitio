import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      return new Response(JSON.stringify({ error: 'Variables de entorno faltantes' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);
    
    // Obtener todas las categorías disponibles con conteos
    const { data: categoryStats, error: categoryError } = await supabase
      .from('products')
      .select(`
        category,
        profiles!inner(is_active)
      `)
      .eq('profiles.is_active', true)
      .gt('stock', 0);

    if (categoryError) {
      console.error('Error obteniendo estadísticas de categorías:', categoryError);
      return new Response(JSON.stringify({ error: 'Error obteniendo categorías' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Agrupar por categoría
    const categoryCounts: Record<string, number> = {};
    (categoryStats || []).forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });

    // Obtener todos los productos activos por categoría
    const allCategories = ['restaurantes', 'minimarkets', 'medicinas', 'postres', 'carniceria', 'servicios', 'mascotas', 'ninos'];
    
    const categoryDetails = await Promise.all(
      allCategories.map(async (category) => {
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id, title, price_cents, image_url, stock, seller_id, category,
            profiles!inner(id, name, phone, is_active)
          `)
          .eq('category', category)
          .gt('stock', 0)
          .eq('profiles.is_active', true);

        return {
          category,
          count: products?.length || 0,
          products: products || [],
          error: error?.message
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      categoryCounts,
      categoryDetails,
      summary: {
        totalCategories: allCategories.length,
        categoriesWithProducts: categoryDetails.filter(c => c.count > 0).length,
        totalProducts: categoryDetails.reduce((sum, c) => sum + c.count, 0)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en debug de categorías:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
