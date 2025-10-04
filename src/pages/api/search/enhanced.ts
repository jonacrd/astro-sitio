import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const query = url.searchParams.get('q') || '';
    console.log('🔍 Búsqueda mejorada:', query);

    if (!query.trim()) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          sellers: [],
          total: 0,
          message: 'Query vacía'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // 1. Buscar TODOS los productos activos (sin límite de stock para incluir servicios)
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select(`
        seller_id, 
        product_id, 
        price_cents, 
        stock, 
        active,
        inventory_mode,
        available_today,
        sold_out,
        prep_minutes
      `)
      .eq('active', true)
      .limit(100); // Aumentar límite para más resultados

    if (spError) {
      console.error('Error obteniendo seller_products:', spError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo seller_products: ' + spError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!sellerProducts || sellerProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          sellers: [],
          total: 0,
          message: 'No hay productos disponibles'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // 2. Obtener TODOS los productos
    const productIds = sellerProducts.map(sp => sp.product_id);
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, title, description, category, image_url')
      .in('id', productIds);

    if (pError) {
      console.error('Error obteniendo products:', pError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo products: ' + pError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 3. Obtener TODOS los vendedores activos
    const sellerIds = [...new Set(sellerProducts.map(sp => sp.seller_id))];
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name, is_active, is_seller')
      .in('id', sellerIds)
      .eq('is_seller', true)
      .eq('is_active', true);

    if (sError) {
      console.error('Error obteniendo sellers:', sError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo sellers: ' + sError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 4. Búsqueda inteligente con múltiples criterios
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    const combinedProducts = sellerProducts.map(sp => {
      const product = products?.find(p => p.id === sp.product_id);
      const seller = sellers?.find(s => s.id === sp.seller_id);
      
      if (!product || !seller) return null;
      
      return {
        id: sp.product_id,
        title: product.title,
        description: product.description,
        category: product.category,
        image: product.image_url || '/img/placeholders/product-placeholder.jpg',
        price: sp.price_cents,
        stock: sp.stock,
        inventory_mode: sp.inventory_mode,
        available_today: sp.available_today,
        sold_out: sp.sold_out,
        prep_minutes: sp.prep_minutes,
        sellerId: sp.seller_id,
        sellerName: seller.name,
        active: sp.active,
        // Puntuación de relevancia para ordenar resultados
        relevanceScore: calculateRelevanceScore(product, seller, searchTerms, query.toLowerCase())
      };
    }).filter(Boolean);

    // 5. Filtrar y ordenar por relevancia
    const filteredProducts = combinedProducts
      .filter(product => 
        // Búsqueda en título, descripción, categoría, vendedor
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.sellerName.toLowerCase().includes(query.toLowerCase()) ||
        // Búsqueda por palabras clave
        searchTerms.some(term => 
          product.title.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.sellerName.toLowerCase().includes(term)
        )
      )
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50); // Limitar a 50 resultados más relevantes

    // 6. Crear lista de vendedores únicos
    const uniqueSellers = sellers?.map(seller => ({
      id: seller.id,
      name: seller.name,
      isActive: seller.is_active,
      productCount: sellerProducts.filter(sp => sp.seller_id === seller.id).length
    })) || [];

    console.log(`✅ Búsqueda mejorada completada: ${filteredProducts.length} productos, ${uniqueSellers.length} vendedores`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        results: filteredProducts,
        sellers: uniqueSellers,
        total: filteredProducts.length,
        message: 'Búsqueda inteligente completada'
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error inesperado en búsqueda mejorada:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

// Función para calcular relevancia de búsqueda
function calculateRelevanceScore(product: any, seller: any, searchTerms: string[], fullQuery: string): number {
  let score = 0;
  
  // Coincidencia exacta en título (máxima prioridad)
  if (product.title.toLowerCase().includes(fullQuery)) {
    score += 100;
  }
  
  // Coincidencia en título con palabras individuales
  searchTerms.forEach(term => {
    if (product.title.toLowerCase().includes(term)) {
      score += 50;
    }
  });
  
  // Coincidencia en categoría
  if (product.category.toLowerCase().includes(fullQuery)) {
    score += 30;
  }
  
  searchTerms.forEach(term => {
    if (product.category.toLowerCase().includes(term)) {
      score += 15;
    }
  });
  
  // Coincidencia en descripción
  searchTerms.forEach(term => {
    if (product.description.toLowerCase().includes(term)) {
      score += 10;
    }
  });
  
  // Coincidencia en nombre del vendedor
  if (seller.name.toLowerCase().includes(fullQuery)) {
    score += 25;
  }
  
  searchTerms.forEach(term => {
    if (seller.name.toLowerCase().includes(term)) {
      score += 12;
    }
  });
  
  return score;
}
