// Endpoint para estadísticas de WhatsApp
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
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
    
    // Obtener estadísticas
    const { data: stats, error } = await supabase
      .from('whatsapp_logs')
      .select('status')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    const total = stats.length;
    const pending = stats.filter(s => s.status === 'pending').length;
    const sent = stats.filter(s => s.status === 'sent').length;
    const failed = stats.filter(s => s.status === 'failed').length;
    
    return new Response(JSON.stringify({
      success: true,
      stats: {
        total,
        pending,
        sent,
        failed
      }
    }), { status: 200 });
    
  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
};



