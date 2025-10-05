import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const query = url.searchParams.get('q') || '';
    console.log('🔍 Búsqueda simple:', query);

    if (!query.trim()) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          results: [],
          sellers: [],
          total: 0,
          message: 'Query vacía'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener TODOS los productos del feed (igual que el feed)
    const { data: feedProducts, error: feedError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          id,
          title,
          description,
          category,
          image_url
        ),
        seller:profiles!seller_products_seller_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .eq('seller.is_active', true);

    if (feedError) {
      console.error('Error obteniendo productos:', feedError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos: ' + feedError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!feedProducts || feedProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          results: [],
          sellers: [],
          total: 0,
          message: 'No hay productos disponibles'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // Búsqueda simple y directa
    const searchTerm = query.toLowerCase().trim();
    const searchWords = searchTerm.split(' ').filter(word => word.length > 1);

    const results = feedProducts
      .map(item => ({
        id: item.product_id,
        title: item.product.title,
        description: item.product.description,
        category: item.product.category,
        image: item.product.image_url || '/img/placeholders/product-placeholder.jpg',
        price: item.price_cents,
        stock: item.stock,
        sellerId: item.seller_id,
        sellerName: item.seller.name,
        active: item.active,
        relevanceScore: 0
      }))
      .filter(product => {
        // Búsqueda simple: título, descripción, categoría, vendedor
        const titleMatch = product.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = product.description && product.description.toLowerCase().includes(searchTerm);
        const categoryMatch = product.category.toLowerCase().includes(searchTerm);
        const sellerMatch = product.sellerName.toLowerCase().includes(searchTerm);
        
        // Búsqueda por palabras individuales
        const wordMatch = searchWords.some(word => 
          product.title.toLowerCase().includes(word) ||
          (product.description && product.description.toLowerCase().includes(word)) ||
          product.category.toLowerCase().includes(word) ||
          product.sellerName.toLowerCase().includes(word)
        );

        return titleMatch || descriptionMatch || categoryMatch || sellerMatch || wordMatch;
      })
      .sort((a, b) => {
        // Ordenar por relevancia: título exacto primero, luego parcial
        const aTitleExact = a.title.toLowerCase().includes(searchTerm);
        const bTitleExact = b.title.toLowerCase().includes(searchTerm);
        
        if (aTitleExact && !bTitleExact) return -1;
        if (!aTitleExact && bTitleExact) return 1;
        
        return a.title.localeCompare(b.title);
      })
      .slice(0, 50); // Limitar a 50 resultados

    // Crear lista de vendedores únicos
    const uniqueSellers = [...new Set(results.map(p => p.sellerId))].map(sellerId => {
      const seller = feedProducts.find(item => item.seller.id === sellerId)?.seller;
      return {
        id: sellerId,
        name: seller?.name || 'Vendedor',
        isActive: seller?.is_active || false,
        productCount: results.filter(p => p.sellerId === sellerId).length
      };
    });

    console.log(`✅ Búsqueda simple completada: ${results.length} productos, ${uniqueSellers.length} vendedores`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        results: results,
        sellers: uniqueSellers,
        total: results.length,
        message: 'Búsqueda simple completada'
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error inesperado en búsqueda simple:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

