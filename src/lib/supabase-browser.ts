import { createClient } from '@supabase/supabase-js';

// Verificar variables de entorno
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de Supabase no configuradas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  console.error('Verifica tu archivo .env y reinicia el servidor');
  throw new Error('Variables de Supabase no configuradas. Verifica tu archivo .env');
}

console.log('✅ Supabase configurado correctamente');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Crear cliente de Supabase optimizado para navegador
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistir sesión en localStorage
    persistSession: true,
    // Auto-refrescar tokens expirados
    autoRefreshToken: true,
    // Detectar sesión en URL (para redirects de email)
    detectSessionInUrl: true,
    // Flujo de autenticación
    flowType: 'pkce'
  },
  // Configuración global
  global: {
    headers: {
      'X-Client-Info': 'astro-sitio@1.0.0'
    }
  }
});

// Verificar conexión inicial
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.warn('⚠️ Error al obtener sesión inicial:', error.message);
  } else if (session) {
    console.log('✅ Sesión encontrada:', session.user.email);
  } else {
    console.log('ℹ️ No hay sesión activa');
  }
});

export default supabase;
