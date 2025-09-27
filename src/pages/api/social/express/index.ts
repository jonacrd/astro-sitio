// =============================================
// API ENDPOINT - EXPRESS POSTS
// =============================================

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, incrementRateLimit, checkUserConsent, recordUserConsent } from '../../../../modules/social/utils/rate-limit';
import type { 
  CreateExpressPostRequest, 
  ExpressPostListResponse, 
  ApiResponse,
  ExpressPostFilters,
  PaginationParams 
} from '../../../../modules/social/types';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://prizpqahcluomioxnmex.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXpxcWFoY2x1b21pb3hubWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NDgwMCwiZXhwIjoyMDUwODQwODAwfQ.ServiceRoleKeyServiceRoleKeyServiceRoleKeyServiceRoleKey'
);

// =============================================
// POST /api/social/express - Crear Express Post
// =============================================

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as CreateExpressPostRequest;
    
    // Obtener usuario autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'UNAUTHORIZED',
          message: 'Authorization header required',
          code: 'MISSING_AUTH',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar consentimiento
    const hasConsent = await checkUserConsent(user.id, 'express_posts_creation');
    if (!hasConsent) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'CONSENT_REQUIRED',
          message: 'User consent required for express posts creation',
          code: 'MISSING_CONSENT',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar rate limit
    const rateLimitResponse = await checkRateLimit(user.id, 'express_posts');
    if (!rateLimitResponse.success) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResponse.message,
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString()
        },
        rate_limit: rateLimitResponse.rate_limit
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validar datos
    const validationErrors = validateExpressPostData(body);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          code: 'VALIDATION_FAILED',
          details: validationErrors,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Crear express post
    const { data: expressPost, error: postError } = await supabase
      .from('express_posts')
      .insert({
        author_id: user.id,
        title: body.title,
        description: body.description,
        price_cents: body.price_cents,
        category: body.category,
        contact_method: body.contact_method,
        contact_value: body.contact_value,
        external_disclaimer_accepted: body.external_disclaimer_accepted,
        location_text: body.location_text,
        media_count: body.media.length
      })
      .select()
      .single();
    
    if (postError) {
      console.error('Error creating express post:', postError);
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'DATABASE_ERROR',
          message: 'Failed to create express post',
          code: 'CREATE_FAILED',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Crear media asociada
    if (body.media.length > 0) {
      const mediaData = body.media.map(media => ({
        post_id: expressPost.id,
        url: media.url,
        media_type: media.media_type,
        sort_order: media.sort_order
      }));
      
      const { error: mediaError } = await supabase
        .from('express_media')
        .insert(mediaData);
      
      if (mediaError) {
        console.error('Error creating media:', mediaError);
        // No fallar la operación, solo loggear el error
      }
    }
    
    // Incrementar rate limit
    await incrementRateLimit(user.id, 'express_posts');
    
    // Registrar consentimiento si no existía
    if (!hasConsent) {
      await recordUserConsent(user.id, 'express_posts_creation', {
        version: '1.0',
        features: ['external_contact', 'media_upload']
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: expressPost,
      rate_limit: rateLimitResponse.rate_limit
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Express post creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// =============================================
// GET /api/social/express - Listar Express Posts
// =============================================

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const status = searchParams.get('status') || 'active';
    const category = searchParams.get('category');
    const author_id = searchParams.get('author_id');
    
    // Construir query
    let query = supabase
      .from('express_posts')
      .select(`
        *,
        express_media(*),
        author:profiles!express_posts_author_id_fkey(id, name, avatar)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit + 1);
    
    // Aplicar filtros
    if (category) {
      query = query.eq('category', category);
    }
    
    if (author_id) {
      query = query.eq('author_id', author_id);
    }
    
    // Aplicar cursor para paginación
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    const { data: posts, error } = await query;
    
    if (error) {
      console.error('Error fetching express posts:', error);
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'DATABASE_ERROR',
          message: 'Failed to fetch express posts',
          code: 'FETCH_FAILED',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Determinar si hay más páginas
    const hasMore = posts.length > limit;
    const actualPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? actualPosts[actualPosts.length - 1]?.created_at : null;
    
    const response: ExpressPostListResponse = {
      posts: actualPosts,
      next_cursor: nextCursor || undefined,
      has_more: hasMore,
      total_count: actualPosts.length
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: response
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Express posts fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function validateExpressPostData(data: CreateExpressPostRequest): Array<{ field: string; message: string; code: string }> {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  
  // Validar título
  if (!data.title || data.title.length < 3 || data.title.length > 100) {
    errors.push({
      field: 'title',
      message: 'Title must be between 3 and 100 characters',
      code: 'INVALID_TITLE_LENGTH'
    });
  }
  
  // Validar descripción
  if (data.description && data.description.length > 1000) {
    errors.push({
      field: 'description',
      message: 'Description must be less than 1000 characters',
      code: 'INVALID_DESCRIPTION_LENGTH'
    });
  }
  
  // Validar precio
  if (data.price_cents !== undefined && (data.price_cents < 0 || data.price_cents > 99999999)) {
    errors.push({
      field: 'price_cents',
      message: 'Price must be between 0 and 99999999 cents',
      code: 'INVALID_PRICE_RANGE'
    });
  }
  
  // Validar categoría
  if (data.category && !['comida', 'tecnologia', 'hogar', 'servicios', 'vehiculos', 'otros'].includes(data.category)) {
    errors.push({
      field: 'category',
      message: 'Invalid category',
      code: 'INVALID_CATEGORY'
    });
  }
  
  // Validar método de contacto
  if (!['whatsapp', 'telefono', 'email', 'directo'].includes(data.contact_method)) {
    errors.push({
      field: 'contact_method',
      message: 'Invalid contact method',
      code: 'INVALID_CONTACT_METHOD'
    });
  }
  
  // Validar valor de contacto
  if (!data.contact_value || data.contact_value.length < 3) {
    errors.push({
      field: 'contact_value',
      message: 'Contact value must be at least 3 characters',
      code: 'INVALID_CONTACT_VALUE'
    });
  }
  
  // Validar media
  if (data.media.length > 10) {
    errors.push({
      field: 'media',
      message: 'Maximum 10 media files allowed',
      code: 'TOO_MANY_MEDIA'
    });
  }
  
  // Validar URLs de media
  data.media.forEach((media, index) => {
    if (!media.url.match(/^https?:\/\//)) {
      errors.push({
        field: `media[${index}].url`,
        message: 'Media URL must be a valid HTTP/HTTPS URL',
        code: 'INVALID_MEDIA_URL'
      });
    }
    
    if (!['image', 'video'].includes(media.media_type)) {
      errors.push({
        field: `media[${index}].media_type`,
        message: 'Media type must be image or video',
        code: 'INVALID_MEDIA_TYPE'
      });
    }
    
    if (media.sort_order < 0 || media.sort_order > 9) {
      errors.push({
        field: `media[${index}].sort_order`,
        message: 'Sort order must be between 0 and 9',
        code: 'INVALID_SORT_ORDER'
      });
    }
  });
  
  // Validar disclaimer
  if (!data.external_disclaimer_accepted) {
    errors.push({
      field: 'external_disclaimer_accepted',
      message: 'External disclaimer must be accepted',
      code: 'DISCLAIMER_NOT_ACCEPTED'
    });
  }
  
  return errors;
}
