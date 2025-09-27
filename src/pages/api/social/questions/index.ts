// =============================================
// API ENDPOINT - QUESTIONS
// =============================================

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, incrementRateLimit } from '../../../../modules/social/utils/rate-limit';
import type { 
  CreateQuestionRequest, 
  QuestionListResponse, 
  ApiResponse 
} from '../../../../modules/social/types';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://prizpqahcluomioxnmex.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXpxcWFoY2x1b21pb3hubWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NDgwMCwiZXhwIjoyMDUwODQwODAwfQ.ServiceRoleKeyServiceRoleKeyServiceRoleKeyServiceRoleKey'
);

// =============================================
// POST /api/social/questions - Crear Pregunta
// =============================================

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as CreateQuestionRequest;
    
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
    
    // Verificar rate limit
    const rateLimitResponse = await checkRateLimit(user.id, 'questions');
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
    const validationErrors = validateQuestionData(body);
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
    
    // Sanitizar y procesar tags
    const sanitizedTags = sanitizeTags(body.tags || []);
    
    // Crear pregunta
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        author_id: user.id,
        body: body.body.trim(),
        tags: sanitizedTags
      })
      .select(`
        *,
        author:profiles!questions_author_id_fkey(id, name, avatar)
      `)
      .single();
    
    if (questionError) {
      console.error('Error creating question:', questionError);
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'DATABASE_ERROR',
          message: 'Failed to create question',
          code: 'CREATE_FAILED',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Incrementar rate limit
    await incrementRateLimit(user.id, 'questions');
    
    return new Response(JSON.stringify({
      success: true,
      data: question,
      rate_limit: rateLimitResponse.rate_limit
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Question creation error:', error);
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
// GET /api/social/questions - Listar Preguntas
// =============================================

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const status = searchParams.get('status') || 'open';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const author_id = searchParams.get('author_id');
    const has_answers = searchParams.get('has_answers');
    
    // Construir query
    let query = supabase
      .from('questions')
      .select(`
        *,
        author:profiles!questions_author_id_fkey(id, name, avatar),
        answers_count:answers(count)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit + 1);
    
    // Aplicar filtros
    if (author_id) {
      query = query.eq('author_id', author_id);
    }
    
    if (tags.length > 0) {
      query = query.overlaps('tags', tags);
    }
    
    if (has_answers === 'true') {
      query = query.gt('answers_count', 0);
    } else if (has_answers === 'false') {
      query = query.eq('answers_count', 0);
    }
    
    // Aplicar cursor para paginación
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    const { data: questions, error } = await query;
    
    if (error) {
      console.error('Error fetching questions:', error);
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'DATABASE_ERROR',
          message: 'Failed to fetch questions',
          code: 'FETCH_FAILED',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Determinar si hay más páginas
    const hasMore = questions.length > limit;
    const actualQuestions = hasMore ? questions.slice(0, limit) : questions;
    const nextCursor = hasMore ? actualQuestions[actualQuestions.length - 1]?.created_at : null;
    
    const response: QuestionListResponse = {
      questions: actualQuestions,
      next_cursor: nextCursor || undefined,
      has_more: hasMore,
      total_count: actualQuestions.length
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: response
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Questions fetch error:', error);
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

function validateQuestionData(data: CreateQuestionRequest): Array<{ field: string; message: string; code: string }> {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  
  // Validar body
  if (!data.body || data.body.length < 280 || data.body.length > 500) {
    errors.push({
      field: 'body',
      message: 'Question body must be between 280 and 500 characters',
      code: 'INVALID_BODY_LENGTH'
    });
  }
  
  // Validar tags
  if (data.tags && data.tags.length > 5) {
    errors.push({
      field: 'tags',
      message: 'Maximum 5 tags allowed',
      code: 'TOO_MANY_TAGS'
    });
  }
  
  if (data.tags) {
    data.tags.forEach((tag, index) => {
      if (tag.length < 2 || tag.length > 20) {
        errors.push({
          field: `tags[${index}]`,
          message: 'Each tag must be between 2 and 20 characters',
          code: 'INVALID_TAG_LENGTH'
        });
      }
      
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
        errors.push({
          field: `tags[${index}]`,
          message: 'Tags can only contain letters, numbers, spaces, hyphens, and underscores',
          code: 'INVALID_TAG_CHARACTERS'
        });
      }
    });
  }
  
  return errors;
}

function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length >= 2 && tag.length <= 20)
    .filter(tag => /^[a-zA-Z0-9\s\-_]+$/.test(tag))
    .slice(0, 5); // Máximo 5 tags
}
