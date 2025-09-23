import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

async function requireAdmin(request: Request) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Response('Supabase not configured', { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new Response('Unauthorized', { status: 401 });
  }
  
  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // Verificar si el usuario es admin (esto requeriría agregar un campo 'role' a profiles)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('name, is_seller')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Response('Profile not found', { status: 404 });
  }

  // Por ahora, solo permitir acceso a vendedores (is_seller = true)
  // En el futuro, agregar un campo 'role' para distinguir admins
  if (!profile.is_seller) {
    throw new Response('Forbidden - Admin access required', { status: 403 });
  }

  return { user, profile };
}

// GET ?q=
export const GET: APIRoute = async ({ request, url }) => {
  try {
    await requireAdmin(request);
    
    const searchQuery = url.searchParams.get('q') || '';
    
    // TODO: Implementar búsqueda de usuarios en Supabase
    // Por ahora, devolver lista vacía
    const list: any[] = [];
    
    return new Response(JSON.stringify({
      success: true,
      data: list,
      total: list.length
    }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: error.status || 500,
      headers: { 'content-type': 'application/json' } 
    });
  }
};

// POST promote/demote/delete
export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    
    const { action, userId } = await request.json();
    if (!action || !userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'action and userId are required'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' } 
      });
    }
    
    // TODO: Implementar acciones de administración con Supabase
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Admin actions not implemented yet',
      action,
      userId
    }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: error.status || 500,
      headers: { 'content-type': 'application/json' } 
    });
  }
};
