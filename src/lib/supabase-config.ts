// =============================================
// CONFIGURACIÓN CENTRALIZADA DE SUPABASE
// =============================================

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase con valores por defecto
export const SUPABASE_CONFIG = {
  url: (typeof process !== 'undefined' ? process.env.SUPABASE_URL : null) || 
       (typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_URL : null) || 
       import.meta.env.PUBLIC_SUPABASE_URL ||
       'https://prizpqahcluomioxnmex.supabase.co',
  
  anonKey: (typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_ANON_KEY : null) || 
           import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXpxcWFoY2x1b21pb3hubWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNjQ4MDAsImV4cCI6MjA1MDg0MDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
  
  serviceRoleKey: (typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : null) || 
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXpxcWFoY2x1b21pb3hubWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NDgwMCwiZXhwIjoyMDUwODQwODAwfQ.ServiceRoleKeyServiceRoleKeyServiceRoleKeyServiceRoleKey'
};

// Cliente para el navegador (con autenticación)
export const createSupabaseClient = () => {
  return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'astro-sitio@1.0.0'
      }
    }
  });
};

// Cliente para el servidor (sin autenticación)
export const createSupabaseServerClient = () => {
  return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    auth: { persistSession: false }
  });
};

// Cliente por defecto (navegador) - Singleton
let supabaseInstance: any = null;
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
})();

// Cliente del servidor por defecto - Singleton
let supabaseServerInstance: any = null;
export const supabaseServer = (() => {
  if (!supabaseServerInstance) {
    supabaseServerInstance = createSupabaseServerClient();
  }
  return supabaseServerInstance;
})();

// Verificar configuración solo una vez
if (typeof window !== 'undefined' && !window.supabaseInitialized) {
  window.supabaseInitialized = true;
  
  console.log('🔧 Supabase Config:');
  console.log('URL:', SUPABASE_CONFIG.url);
  console.log('Anon Key:', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
  console.log('Service Role Key:', SUPABASE_CONFIG.serviceRoleKey.substring(0, 20) + '...');
}
