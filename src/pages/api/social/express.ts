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
    const status = url.searchParams.get('status') || 'active';

    // Por ahora retornar datos mock hasta que se implemente la tabla express_posts
    const mockExpressPosts = [
      {
        id: 'express-1',
        title: 'Venta Express - iPhone 13',
        description: 'iPhone 13 en perfecto estado, solo 6 meses de uso',
        price_cents: 450000,
        contact_method: 'whatsapp',
        contact_value: '+56912345678',
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        media: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&h=300&q=80']
      },
      {
        id: 'express-2',
        title: 'Venta Express - Bicicleta',
        description: 'Bicicleta de montaña en excelente estado',
        price_cents: 120000,
        contact_method: 'phone',
        contact_value: '+56987654321',
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        media: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=400&h=300&q=80']
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: {
        posts: mockExpressPosts,
        next_cursor: null,
        has_more: false
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in express posts API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

