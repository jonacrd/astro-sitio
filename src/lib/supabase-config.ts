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
           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXpwcWFoY2x1b21pb3hubWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTIxNjIsImV4cCI6MjA3MzM2ODE2Mn0.8on4o09S5mOdRu-4Vf0pzMZBcz6B4ENP3WajFBy53Z4',
  
  serviceRoleKey: (typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : null) || 
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXpwcWFoY2x1b21pb3hubWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc5MjE2MiwiZXhwIjoyMDczMzY4MTYyfQ.wDrqbDNCtrNdNQ30RRaR1G6oySFUdLUWt0hb9CcUxbk'
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

// Cliente por defecto (navegador) - Singleton mejorado
let supabaseInstance: any = null;

export const supabase = (() => {
  // Solo inicializar en el navegador
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!supabaseInstance) {
    console.log('🔧 Inicializando cliente Supabase...');
    try {
      supabaseInstance = createSupabaseClient();
      
      // Marcar como inicializado globalmente
      if (!(window as any).supabaseClientInitialized) {
        (window as any).supabaseClientInitialized = true;
        console.log('✅ Cliente Supabase inicializado correctamente');
      }
    } catch (error) {
      console.error('❌ Error inicializando Supabase:', error);
      return null;
    }
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

// Función helper para verificar si Supabase está disponible
export const isSupabaseAvailable = (): boolean => {
  return supabase !== null && typeof window !== 'undefined';
};

// Función helper para obtener Supabase de forma segura
export const getSupabase = () => {
  if (!isSupabaseAvailable()) {
    console.warn('⚠️ Supabase no está disponible');
    return null;
  }
  return supabase;
};

// Verificar configuración solo una vez
if (typeof window !== 'undefined' && !(window as any).supabaseInitialized) {
  (window as any).supabaseInitialized = true;
  
  console.log('🔧 Supabase Config:');
  console.log('URL:', SUPABASE_CONFIG.url);
  console.log('Anon Key:', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
  console.log('Service Role Key:', SUPABASE_CONFIG.serviceRoleKey.substring(0, 20) + '...');
}
