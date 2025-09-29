import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-browser';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error obteniendo sesión inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Estado de autenticación cambiado:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);

        // Disparar evento personalizado
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: { user: session?.user, type: event }
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}