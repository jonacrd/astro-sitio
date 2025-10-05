import React, { useState, useEffect } from 'react';

interface BottomNavProps {
  role?: 'buyer' | 'seller';
  notifications?: number;
  orders?: number;
  rewards?: number;
}

export default function BottomNav({ 
  role = 'buyer', 
  notifications = 0, 
  orders = 0, 
  rewards = 0 
}: BottomNavProps) {
  const [currentPath, setCurrentPath] = useState('/');
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      badge: orders > 0 ? orders : undefined
    },
    {
      id: 'rewards',
      label: 'Recompensas',
      href: '/recompensas',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      badge: rewards > 0 ? rewards : undefined
    },
    {
      id: 'profile',
      label: 'Perfil',
      href: '/perfil',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  };

  return (
    <nav 
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-surface/80 backdrop-blur-md border-t border-white/10
        safe-area-pb
        transition-opacity duration-300
        ${scrollDirection === 'down' ? 'opacity-90' : 'opacity-100'}
      `}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`
              relative flex flex-col items-center justify-center
              px-3 py-2 rounded-xl
              transition-all duration-200
              min-w-0 flex-1
              ${isActive(item.href) 
                ? 'text-accent bg-accent/10' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
              }
            `}
            aria-current={isActive(item.href) ? 'page' : undefined}
            aria-label={item.label}
          >
            {/* Icono */}
            <div className="relative">
              {item.icon}
              
              {/* Badge de notificaciones */}
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-accent text-primary text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            
            {/* Etiqueta */}
            <span className="text-xs font-medium mt-1 truncate max-w-full">
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}









