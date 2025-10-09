import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getSupabase, isSupabaseAvailable } from '../../lib/supabase-config';
import { getUserAvatar } from '../../lib/avatar-utils';
import { getCachedAuth, setCachedAuth, clearAuthCache } from '../../lib/auth-cache';

export default function SimpleAuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Verificar autenticación (optimizado)
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Verificar si Supabase está disponible
        if (!isSupabaseAvailable()) {
          console.warn('⚠️ Supabase no está disponible, saltando verificación de auth');
          return;
        }
        
        const supabaseClient = getSupabase();
        if (!supabaseClient) {
          console.warn('⚠️ No se pudo obtener cliente de Supabase');
          return;
        }
        
        // Verificar cache primero
        const cached = getCachedAuth();
        if (cached && isMounted) {
          console.log('⚡ Usando datos de cache para auth');
          setIsAuthenticated(true);
          setUserEmail(cached.user.email || '');
          setUserProfile(cached.profile);
          return;
        }
        
        // Verificar si ya hay una sesión en cache
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!isMounted) return; // Evitar actualizaciones si el componente se desmontó
        
        if (session?.user) {
          console.log('🔍 Usuario autenticado encontrado:', session.user.email);
          setIsAuthenticated(true);
          setUserEmail(session.user.email || '');
          
          // Cargar perfil del usuario solo si no está en cache
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('is_seller')
            .eq('id', session.user.id)
            .single();
          
          if (isMounted) {
            const profileData = {
              ...profile,
              raw_user_meta_data: session.user.user_metadata
            };
            setUserProfile(profileData);
            
            // Guardar en cache
            setCachedAuth(session.user, profileData);
          }
        } else {
          console.log('🔍 No hay sesión activa');
          if (isMounted) {
            setIsAuthenticated(false);
            setUserEmail('');
            setUserProfile(null);
            clearAuthCache();
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setUserEmail('');
          setUserProfile(null);
          clearAuthCache();
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };

    // Escuchar eventos personalizados de autenticación (optimizado)
    const handleAuthStateChanged = async (event: CustomEvent) => {
      if (!isMounted) return;
      
      console.log('📢 Auth state changed event received:', event.detail);
      if (event.detail?.user) {
        setIsAuthenticated(true);
        setUserEmail(event.detail.user.email || '');
        
        // Cargar perfil del usuario solo si es necesario
        try {
          const supabaseClient = getSupabase();
          if (!supabaseClient) return;
          
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('is_seller')
            .eq('id', event.detail.user.id)
            .single();
          
          if (isMounted) {
            setUserProfile({
              ...profile,
              raw_user_meta_data: event.detail.user.user_metadata
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChanged as EventListener);

    // Escuchar cambios de autenticación (optimizado)
    const supabaseClient = getSupabase();
    if (!supabaseClient) {
      console.warn('⚠️ No se puede configurar listener de auth state change');
      return () => {};
    }
    
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
        
        // Cargar perfil del usuario solo si es necesario
        try {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('is_seller')
            .eq('id', session.user.id)
            .single();
          
          if (isMounted) {
            setUserProfile({
              ...profile,
              raw_user_meta_data: session.user.user_metadata
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      } else {
        if (isMounted) {
          setIsAuthenticated(false);
          setUserEmail('');
          setUserProfile(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth-state-changed', handleAuthStateChanged as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) {
        console.warn('⚠️ No se puede hacer logout, Supabase no disponible');
        return;
      }
      
      await supabaseClient.auth.signOut();
      setIsAuthenticated(false);
      setUserEmail('');
      setUserProfile(null);
      setIsOpen(false);
      clearAuthCache();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    // Usar el sistema global de modales
    window.dispatchEvent(new CustomEvent('show-login-modal', { 
      detail: { mode: 'login' } 
    }));
  };

  const handleRegisterClick = () => {
    setIsOpen(false);
    // Usar el sistema global de modales
    window.dispatchEvent(new CustomEvent('show-login-modal', { 
      detail: { mode: 'register' } 
    }));
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="hidden sm:inline">Cuenta</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown para usuarios no autenticados */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700/50 py-2 z-[70]">
            <div className="px-4 py-3 border-b border-gray-700/50">
              <p className="text-sm font-medium text-gray-100">Acceder a tu cuenta</p>
              <p className="text-xs text-gray-400">Inicia sesión o regístrate</p>
            </div>

            <div className="py-1">
              <button
                onClick={handleLoginClick}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-blue-500/20 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">Iniciar Sesión</p>
                  <p className="text-xs text-gray-400">Accede a tu cuenta</p>
                </div>
              </button>

              <button
                onClick={handleRegisterClick}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-green-500/20 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">Registrarse</p>
                  <p className="text-xs text-gray-400">Crear nueva cuenta</p>
                </div>
              </button>
            </div>

            <div className="border-t border-gray-700/50 mt-2 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-2 text-left text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm">Cancelar</span>
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Usuario autenticado
  const avatarUrl = getUserAvatar(userProfile);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
      >
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
          onError={(e) => {
            // Fallback si la imagen no carga
            e.currentTarget.src = '/male-icon.png';
          }}
        />
        <span className="hidden sm:inline text-sm">{userEmail}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown para usuarios autenticados */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700/50 py-2 z-[70]">
          <div className="px-4 py-3 border-b border-gray-700/50">
            <p className="text-sm font-medium text-gray-100">{userEmail}</p>
            <p className="text-xs text-gray-400">Tu cuenta</p>
          </div>

          <div className="py-1">
            {[
              { icon: '👤', label: 'Mi Perfil', path: '/perfil' },
              { icon: '🛒', label: 'Mis Pedidos', path: '/mis-pedidos' },
              { icon: '⭐', label: 'Recompensas', path: '/recompensas' },
              { icon: '📍', label: 'Direcciones', path: '/direcciones' }
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-800/50 border border-gray-700/30 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">{item.label}</p>
                  <p className="text-xs text-gray-400">Gestiona tu {item.label.toLowerCase()}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-700/50 my-1"></div>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-500/20 transition-colors"
          >
            <div className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-400">Cerrar Sesión</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
