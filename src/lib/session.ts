import { supabase } from './supabase-browser';
import type { User, Session } from '@supabase/supabase-js';

// Estado global de autenticación
let currentUser: User | null = null;
let currentSession: Session | null = null;
let isInitialized = false;
let authListeners: Array<(user: User | null, session: Session | null) => void> = [];

/**
 * Obtiene la sesión actual de forma segura
 * Espera a que Supabase esté inicializado
 */
export async function getSession(): Promise<{ user: User | null; session: Session | null }> {
  // Si ya está inicializado, devolver datos en caché
  if (isInitialized) {
    return { user: currentUser, session: currentSession };
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('⚠️ Error al obtener sesión:', error.message);
      return { user: null, session: null };
    }

    // Actualizar estado global
    currentSession = session;
    currentUser = session?.user || null;
    isInitialized = true;

    return { user: currentUser, session: currentSession };
  } catch (error) {
    console.error('❌ Error inesperado al obtener sesión:', error);
    return { user: null, session: null };
  }
}

/**
 * Obtiene el usuario actual de forma segura
 */
export async function getUser(): Promise<User | null> {
  const { user } = await getSession();
  return user;
}

/**
 * Suscribe a cambios de autenticación
 * @param callback Función que se ejecuta cuando cambia el estado de auth
 * @returns Función para cancelar la suscripción
 */
export function onAuthChange(callback: (user: User | null, session: Session | null) => void): () => void {
  // Agregar listener
  authListeners.push(callback);

  // Si ya hay datos, ejecutar callback inmediatamente
  if (isInitialized) {
    callback(currentUser, currentSession);
  }

  // Configurar listener de Supabase (solo una vez)
  if (authListeners.length === 1) {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      
      // Actualizar estado global
      currentSession = session;
      currentUser = session?.user || null;
      isInitialized = true;

      // Notificar a todos los listeners
      authListeners.forEach(listener => {
        try {
          listener(currentUser, currentSession);
        } catch (error) {
          console.error('❌ Error en auth listener:', error);
        }
      });
    });
  }

  // Retornar función para cancelar suscripción
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getSession();
  return !!user;
}

/**
 * Obtiene el perfil del usuario actual
 */
export async function getUserProfile() {
  const { user } = await getSession();
  if (!user) return null;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('name, phone, is_seller')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error al obtener perfil:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('❌ Error inesperado al obtener perfil:', error);
    return null;
  }
}

/**
 * Cierra la sesión actual
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Error al cerrar sesión:', error);
      throw error;
    }
    
    // Limpiar estado global
    currentUser = null;
    currentSession = null;
    isInitialized = true;
    
    console.log('✅ Sesión cerrada exitosamente');
  } catch (error) {
    console.error('❌ Error inesperado al cerrar sesión:', error);
    throw error;
  }
}

/**
 * Inicia sesión con email y contraseña
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Error al iniciar sesión:', error);
      throw error;
    }

    console.log('✅ Sesión iniciada:', data.user?.email);
    return data;
  } catch (error) {
    console.error('❌ Error inesperado al iniciar sesión:', error);
    throw error;
  }
}

/**
 * Registra un nuevo usuario
 */
export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('❌ Error al registrarse:', error);
      throw error;
    }

    console.log('✅ Usuario registrado:', data.user?.email);
    return data;
  } catch (error) {
    console.error('❌ Error inesperado al registrarse:', error);
    throw error;
  }
}

/**
 * Envía email para restablecer contraseña
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('❌ Error enviando email de restablecimiento:', error);
      throw error;
    }

    console.log('✅ Email de restablecimiento enviado a:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error inesperado enviando email:', error);
    throw error;
  }
}

/**
 * Actualiza la contraseña del usuario autenticado
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('❌ Error actualizando contraseña:', error);
      throw error;
    }

    console.log('✅ Contraseña actualizada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error inesperado actualizando contraseña:', error);
    throw error;
  }
}