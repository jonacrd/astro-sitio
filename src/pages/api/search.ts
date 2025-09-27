import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchFilters {
  openNow?: boolean;
  hasDelivery?: boolean;
  freeDelivery?: boolean;
  radiusKm?: number;
}

interface SearchResult {
  type: 'product' | 'post' | 'question';
  id: string;
  title: string;
  snippet: string;
  seller?: string;
  openNow?: boolean;
  hasDelivery?: boolean;
  rank: number;
  price_cents?: number;
  image_url?: string;
  category?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { q, filters = {} }: { q: string; filters?: SearchFilters } = await request.json();

    if (!q || q.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const searchQuery = q.trim();
    const results: SearchResult[] = [];

    // 1. Buscar productos con FTS
    const productsQuery = supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        price_cents,
        image_url,
        category,
        seller_products!inner(
          seller_id,
          is_available,
          price_cents,
          sellers!inner(
            name,
            is_open,
            delivery_type,
            delivery_fee_cents
          )
        )
      `)
      .textSearch('fts_vector', searchQuery, {
        type: 'websearch',
        config: 'spanish'
      })
      .order('rank', { ascending: false })
      .limit(20);

    // Aplicar filtros a productos
    if (filters.openNow) {
      productsQuery.eq('seller_products.sellers.is_open', true);
    }
    if (filters.hasDelivery) {
      productsQuery.not('seller_products.sellers.delivery_type', 'is', null);
    }
    if (filters.freeDelivery) {
      productsQuery.eq('seller_products.sellers.delivery_fee_cents', 0);
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      console.error('Error searching products:', productsError);
    } else if (products) {
      products.forEach(product => {
        const seller = product.seller_products?.sellers;
        const snippet = product.description?.substring(0, 150) || '';
        const priceCents = product.seller_products?.price_cents || product.price_cents || 0;
        
        results.push({
          type: 'product',
          id: product.id,
          title: product.title,
          snippet: snippet + (snippet.length >= 150 ? '...' : ''),
          seller: seller?.name,
          openNow: seller?.is_open || false,
          hasDelivery: seller?.delivery_type !== null,
          rank: 0.8, // Boost para productos
          price_cents: priceCents,
          image_url: product.image_url,
          category: product.category
        });
      });
    }

    // 2. Buscar posts express con FTS
    const postsQuery = supabase
      .from('express_posts')
      .select(`
        id,
        title,
        content,
        created_at,
        expires_at,
        seller_id,
        sellers!inner(
          name,
          is_open,
          delivery_type
        )
      `)
      .textSearch('fts_vector', searchQuery, {
        type: 'websearch',
        config: 'spanish'
      })
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error('Error searching posts:', postsError);
    } else if (posts) {
      posts.forEach(post => {
        const seller = post.sellers;
        const snippet = post.content?.substring(0, 150) || '';
        
        results.push({
          type: 'post',
          id: post.id,
          title: post.title,
          snippet: snippet + (snippet.length >= 150 ? '...' : ''),
          seller: seller?.name,
          openNow: seller?.is_open || false,
          hasDelivery: seller?.delivery_type !== null,
          rank: 0.6 // Boost medio para posts
        });
      });
    }

    // 3. Buscar preguntas con FTS
    const questionsQuery = supabase
      .from('questions')
      .select(`
        id,
        title,
        content,
        created_at,
        user_id,
        profiles!inner(
          name
        )
      `)
      .textSearch('fts_vector', searchQuery, {
        type: 'websearch',
        config: 'spanish'
      })
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: questions, error: questionsError } = await questionsQuery;

    if (questionsError) {
      console.error('Error searching questions:', questionsError);
    } else if (questions) {
      questions.forEach(question => {
        const snippet = question.content?.substring(0, 150) || '';
        
        results.push({
          type: 'question',
          id: question.id,
          title: question.title,
          snippet: snippet + (snippet.length >= 150 ? '...' : ''),
          seller: question.profiles?.name,
          rank: 0.4 // Boost bajo para preguntas
        });
      });
    }

    // Aplicar boost adicional para "abierto ahora"
    results.forEach(result => {
      if (result.openNow) {
        result.rank += 0.2; // Boost adicional para tiendas abiertas
      }
    });

    // Ordenar por rank final
    results.sort((a, b) => b.rank - a.rank);

    return new Response(JSON.stringify({
      success: true,
      data: {
        query: searchQuery,
        results: results.slice(0, 30), // Limitar a 30 resultados
        total: results.length,
        filters: filters
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q');
  const openNow = url.searchParams.get('openNow') === 'true';
  const hasDelivery = url.searchParams.get('hasDelivery') === 'true';
  const freeDelivery = url.searchParams.get('freeDelivery') === 'true';
  const radiusKm = url.searchParams.get('radiusKm') ? parseInt(url.searchParams.get('radiusKm')!) : undefined;

  if (!q) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Query parameter is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const filters: SearchFilters = {
    openNow,
    hasDelivery,
    freeDelivery,
    radiusKm
  };

  // Simular POST request
  const mockRequest = {
    json: async () => ({ q, filters })
  };

  return POST({ request: mockRequest as any });
};
