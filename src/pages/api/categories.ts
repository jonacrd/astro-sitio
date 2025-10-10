import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Supabase environment variables not configured.'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Obtener categorías únicas de los productos activos
    const { data: categories, error } = await supabase
      .from('seller_products')
      .select(`
        product:products!inner(
          category
        )
      `)
      .eq('active', true)
      .gt('stock', 0);

    if (error) {
      console.error('Error obteniendo categorías:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo categorías: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Procesar categorías únicas
    const categoryMap = new Map();
    
    categories?.forEach((item: any) => {
      const category = item.product.category;
      if (category && !categoryMap.has(category)) {
        categoryMap.set(category, {
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          description: `Productos de ${category}`,
          productCount: 0,
          imageUrl: null
        });
      }
    });

    // Contar productos por categoría
    for (const [categoryId, categoryData] of categoryMap) {
      const { data: countData, error: countError } = await supabase
        .from('seller_products')
        .select('id', { count: 'exact' })
        .eq('active', true)
        .gt('stock', 0)
        .eq('product.category', categoryId);

      if (!countError && countData) {
        categoryData.productCount = countData.length;
      }
    }

    const categoriesList = Array.from(categoryMap.values());

    return new Response(JSON.stringify({
      success: true,
      data: {
        categories: categoriesList,
        total: categoriesList.length
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/categories:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};












