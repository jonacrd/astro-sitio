// Endpoint para procesar WhatsApp pendientes
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async () => {
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
    
    // Obtener mensajes pendientes
    const { data: pendingMessages, error } = await supabase
      .from('whatsapp_logs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No hay mensajes pendientes',
        count: 0
      }), { status: 200 });
    }
    
    // Procesar cada mensaje
    const results = [];
    for (const msg of pendingMessages) {
      try {
        console.log(`📱 Procesando WhatsApp para ${msg.phone}: ${msg.message}`);
        
        // Aquí podrías integrar con un servicio de automatización
        // Por ahora, marcamos como enviado
        await supabase
          .from('whatsapp_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', msg.id);
        
        results.push({
          id: msg.id,
          phone: msg.phone,
          status: 'sent',
          url: msg.url
        });
        
        console.log(`✅ WhatsApp procesado: ${msg.phone}`);
      } catch (error) {
        console.error(`❌ Error procesando WhatsApp ${msg.id}:`, error);
        
        await supabase
          .from('whatsapp_logs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', msg.id);
        
        results.push({
          id: msg.id,
          phone: msg.phone,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Procesados ${results.length} mensajes`,
      results
    }), { status: 200 });
    
  } catch (error: any) {
    console.error('❌ Error procesando WhatsApp:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
};



