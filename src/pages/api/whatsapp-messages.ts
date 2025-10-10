// Endpoint para obtener mensajes de WhatsApp
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Supabase no configurado'
      }), { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    
    let query = supabase
      .from('whatsapp_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: messages, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({
      success: true,
      messages: messages || []
    }), { status: 200 });
    
  } catch (error: any) {
    console.error('❌ Error obteniendo mensajes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
};



