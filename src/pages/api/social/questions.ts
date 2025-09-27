import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: APIRoute = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || 'open';

    // Por ahora retornar datos mock hasta que se implemente la tabla questions
    const mockQuestions = [
      {
        id: 'question-1',
        title: '¿Alguien sabe de un buen mecánico?',
        description: 'Necesito un mecánico confiable para mi auto',
        status: 'open',
        created_at: new Date().toISOString(),
        author_id: 'user-1',
        tags: ['mecánica', 'auto'],
        answers_count: 3
      },
      {
        id: 'question-2',
        title: '¿Dónde consigo adaptación de gas?',
        description: 'Necesito adaptar mi cocina a gas',
        status: 'open',
        created_at: new Date().toISOString(),
        author_id: 'user-2',
        tags: ['gas', 'cocina'],
        answers_count: 5
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: {
        questions: mockQuestions,
        next_cursor: null,
        has_more: false
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in questions API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

