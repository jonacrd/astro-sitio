// API para actualizar número de teléfono del usuario
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { phone, savePhone } = await request.json();
    
    // Obtener usuario actual (simulado para desarrollo)
    const userId = 'test_customer_id'; // En producción, obtener del token de sesión
    
    // Conectar a Supabase
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Supabase no configurado'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Actualizar número de teléfono en perfil
    const { error } = await supabase
      .from('profiles')
      .update({ phone })
      .eq('id', userId);
    
    if (error) {
      console.error('Error actualizando teléfono:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando perfil'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`✅ Usuario ${userId} actualizado con teléfono ${phone}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Número de teléfono actualizado',
      phone
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Error en update-phone:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


