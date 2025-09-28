import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  isSeller: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isSeller: false
  });

  useEffect(() => {
    let mounted = true;

    // Verificar sesión inicial
    const initAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;

        if (error || !user) {
          setAuthState({
            user: null,
            loading: false,
            isSeller: false
          });
          return;
        }

        // Obtener rol del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', user.id)
          .single();

        if (mounted) {
          setAuthState({
            user,
            loading: false,
            isSeller: profile?.is_seller || false
          });
        }
      } catch (error) {
        console.error('❌ Error in initAuth:', error);
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            isSeller: false
          });
        }
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          // Obtener rol del usuario
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_seller')
            .eq('id', session.user.id)
            .single();

          if (mounted) {
            setAuthState({
              user: session.user,
              loading: false,
              isSeller: profile?.is_seller || false
            });
          }
        } else {
          if (mounted) {
            setAuthState({
              user: null,
              loading: false,
              isSeller: false
            });
          }
        }
      }
    );

    // Escuchar eventos personalizados
    const handleAuthStateChanged = (event: CustomEvent) => {
      if (!mounted) return;
      console.log('📡 Custom auth event received:', event.detail);
      initAuth();
    };

    window.addEventListener('auth-state-changed', handleAuthStateChanged as EventListener);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('auth-state-changed', handleAuthStateChanged as EventListener);
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setAuthState({
          user: null,
          loading: false,
          isSeller: false
        });
        return;
      }

      // Obtener rol del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', user.id)
        .single();

      setAuthState({
        user,
        loading: false,
        isSeller: profile?.is_seller || false
      });

    } catch (error) {
      console.error('❌ Error checking session:', error);
      setAuthState({
        user: null,
        loading: false,
        isSeller: false
      });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        user: null,
        loading: false,
        isSeller: false
      });
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  };

  return {
    ...authState,
    logout,
    checkSession
  };
}
