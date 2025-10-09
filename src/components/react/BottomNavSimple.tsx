import React, { useState, useEffect } from 'react';

interface BottomNavSimpleProps {
  role?: 'buyer' | 'seller';
  notifications?: number;
  orders?: number;
  rewards?: number;
}

export default function BottomNavSimple({ 
  role = 'buyer', 
  notifications = 0, 
  orders = 0, 
  rewards = 0 
}: BottomNavSimpleProps) {
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
      icon: '🏠'
    },
    {
      id: 'search',
      label: 'Buscar',
      href: '/buscar',
      icon: '🔍'
    },
    {
      id: 'orders',
      label: role === 'seller' ? 'Entregas' : 'Pedidos',
      href: role === 'seller' ? '/dashboard/entregas' : '/mis-pedidos',
      icon: '📦',
      badge: orders > 0 ? orders : undefined
    },
    {
      id: 'rewards',
      label: 'Recompensas',
      href: '/recompensas',
      icon: '🎁',
      badge: rewards > 0 ? rewards : undefined
    },
    {
      id: 'profile',
      label: 'Perfil',
      href: '/perfil',
      icon: '👤',
      badge: notifications > 0 ? notifications : undefined
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
            <div className="relative text-2xl">
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










