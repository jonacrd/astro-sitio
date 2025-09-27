import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface ProfileDropdownProps {
  onNavigate: (path: string) => void;
}

export default function ProfileDropdown({ onNavigate }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || '');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
      } else {
        setIsAuthenticated(false);
        setUserEmail('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserEmail('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleMenuItemClick = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => onNavigate('/login')}
        className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="hidden sm:inline">Iniciar Sesión</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón del perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="profile-btn-opaque flex items-center gap-2 px-3 py-2 rounded-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="hidden sm:inline text-sm truncate max-w-32">{userEmail}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="profile-dropdown-opaque absolute right-0 top-full mt-2 w-64 rounded-lg shadow-lg py-2 z-50">
          {/* Header del dropdown */}
          <div className="px-4 py-3 border-b border-gray-600">
            <p className="text-sm font-medium text-white truncate">{userEmail}</p>
            <p className="text-xs text-gray-300">Mi Perfil</p>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            <button
              onClick={() => handleMenuItemClick('/mis-pedidos')}
              className="profile-dropdown-item-opaque flex items-center gap-3 w-full px-4 py-3 text-left"
            >
              <div className="profile-icon-orders w-8 h-8 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Mis Pedidos</p>
                <p className="text-xs text-gray-300">Gestiona tus compras</p>
              </div>
            </button>

            <button
              onClick={() => handleMenuItemClick('/recompensas')}
              className="profile-dropdown-item-opaque flex items-center gap-3 w-full px-4 py-3 text-left"
            >
              <div className="profile-icon-rewards w-8 h-8 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Recompensas</p>
                <p className="text-xs text-gray-300">Puntos y descuentos</p>
              </div>
            </button>

            <button
              onClick={() => handleMenuItemClick('/direcciones')}
              className="profile-dropdown-item-opaque flex items-center gap-3 w-full px-4 py-3 text-left"
            >
              <div className="profile-icon-addresses w-8 h-8 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Direcciones</p>
                <p className="text-xs text-gray-300">Gestiona tus direcciones</p>
              </div>
            </button>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-600 my-1"></div>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="profile-dropdown-item-opaque flex items-center gap-3 w-full px-4 py-3 text-left"
          >
            <div className="profile-icon-logout w-8 h-8 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Cerrar Sesión</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
