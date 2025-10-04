import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import LoginForm from './LoginForm';
import { getUserAvatar } from '../../lib/avatar-utils';
import { getCachedAuth, setCachedAuth, clearAuthCache } from '../../lib/auth-cache';

export default function SimpleAuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Verificar autenticación (optimizado)
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return; // Evitar actualizaciones si el componente se desmontó
        
        if (session?.user) {
          console.log('🔍 Usuario autenticado encontrado:', session.user.email);
          setIsAuthenticated(true);
          setUserEmail(session.user.email || '');
          
          // Cargar perfil del usuario solo si no está en cache
          const { data: profile } = await supabase
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
          const { data: profile } = await supabase
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
        
        // Cargar perfil del usuario solo si es necesario
        try {
          const { data: profile } = await supabase
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
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserEmail('');
      setUserProfile(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    setShowLoginModal(true);
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
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[70]">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">Acceder a tu cuenta</p>
              <p className="text-xs text-gray-600">Inicia sesión o regístrate</p>
            </div>

            <div className="py-1">
              <button
                onClick={handleLoginClick}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Iniciar Sesión</p>
                  <p className="text-xs text-gray-500">Accede a tu cuenta</p>
                </div>
              </button>

              <button
                onClick={handleLoginClick}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-green-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Registrarse</p>
                  <p className="text-xs text-gray-500">Crear nueva cuenta</p>
                </div>
              </button>
            </div>

            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-2 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm">Cancelar</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal de login simple */}
        {showLoginModal && (
          <div 
            onClick={() => setShowLoginModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999,
              width: '100vw',
              height: '100vh'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                maxWidth: '28rem',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">🔐 Acceso a tu cuenta</h2>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <LoginForm 
                onLoginSuccess={(user) => {
                  console.log('✅ Login exitoso desde SimpleAuthButton:', user.email);
                  setIsAuthenticated(true);
                  setUserEmail(user.email || '');
                  setShowLoginModal(false);
                  // Recargar la página para actualizar el estado de autenticación
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                }}
                onClose={() => setShowLoginModal(false)}
              />

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
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
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[70]">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{userEmail}</p>
            <p className="text-xs text-gray-500">Tu cuenta</p>
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
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">Gestiona tu {item.label.toLowerCase()}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 my-1"></div>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">Cerrar Sesión</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
