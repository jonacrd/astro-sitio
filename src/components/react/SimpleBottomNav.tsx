import React, { useState, useEffect } from 'react';
import { getUser } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';
import LoginForm from './LoginForm';

interface SimpleBottomNavProps {
  role?: 'buyer' | 'seller';
  notifications?: number;
  orders?: number;
  rewards?: number;
}

export default function SimpleBottomNav({ 
  role = 'buyer', 
  notifications = 0, 
  orders = 0, 
  rewards = 0 
}: SimpleBottomNavProps) {
  console.log('🔍 SimpleBottomNav renderizando...');
  
  const [currentPath, setCurrentPath] = useState('/');
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Detectar dirección del scroll para animación de opacidad
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Actualizar ruta actual
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems = [
    {
      id: 'home',
      label: 'Inicio',
      href: '/',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'search',
      label: 'Buscar',
      href: '/buscar',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: 'orders',
      label: role === 'seller' ? 'Entregas' : 'Pedidos',
      href: role === 'seller' ? '/dashboard/entregas' : '/mis-pedidos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      badge: orders > 0 ? orders : undefined,
      requiresAuth: true
    },
    {
      id: 'rewards',
      label: 'Recompensas',
      href: '/recompensas',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      badge: rewards > 0 ? rewards : undefined,
      requiresAuth: true
    },
    {
      id: 'profile',
      label: 'Perfil',
      href: '/perfil',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      badge: notifications > 0 ? notifications : undefined,
      requiresAuth: true
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  };

  const handleNavItemClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    // Si requiere autenticación y no está autenticado, mostrar modal
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault();
      console.log('🚨 SIMPLE BOTTOM NAV: Abriendo modal de login');
      setLoginModalOpen(true);
      return;
    }

    // Si no requiere autenticación o está autenticado, navegar normalmente
    window.location.href = item.href;
  };

  // No mostrar nada mientras carga la autenticación
  if (authLoading) {
    return null;
  }

  return (
    <>
      <div 
        className={`
          transition-opacity duration-300
          ${scrollDirection === 'down' ? 'opacity-90' : 'opacity-100'}
        `}
      >
        <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={(e) => handleNavItemClick(item, e)}
              className={`
                relative flex flex-col items-center justify-center
                px-3 py-2 rounded-xl
                transition-all duration-200
                min-w-0 flex-1
                ${isActive(item.href) 
                  ? 'text-button-primary bg-button-primary/10' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }
              `}
              style={{
                color: isActive(item.href) ? '#2563EB' : '#CBD5E1',
                backgroundColor: isActive(item.href) ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
              }}
              aria-label={item.label}
            >
              {/* Icono */}
              <div className="relative">
                {item.icon}
                
                {/* Badge */}
                {item.badge && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
                    style={{ backgroundColor: '#E11D48' }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Etiqueta */}
              <span className="text-xs font-medium mt-1 truncate max-w-full">
                {item.label}
              </span>

              {/* Indicador de que requiere login */}
              {item.requiresAuth && !isAuthenticated && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white/20" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Modal de login simple - MISMO QUE EL HEADER */}
      {loginModalOpen && (
        <div 
          onClick={() => setLoginModalOpen(false)}
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
                onClick={() => setLoginModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <LoginForm 
              onLoginSuccess={(user) => {
                console.log('✅ Login exitoso desde SimpleBottomNav:', user.email);
                setIsAuthenticated(true);
                setLoginModalOpen(false);
                // Recargar la página para actualizar el estado de autenticación
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }}
              onClose={() => setLoginModalOpen(false)}
            />

            <div className="mt-4 text-center">
              <button
                onClick={() => setLoginModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
