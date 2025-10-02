import React, { useState, useEffect } from 'react';

interface EmergencyBottomNavProps {
  role?: 'buyer' | 'seller';
  notifications?: number;
  orders?: number;
  rewards?: number;
}

export default function EmergencyBottomNav({ 
  role = 'buyer', 
  notifications = 0, 
  orders = 0, 
  rewards = 0 
}: EmergencyBottomNavProps) {
  console.log('🚨 EmergencyBottomNav renderizando');
  const [currentPath, setCurrentPath] = useState('/');

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
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 0, 0, 0.9)', // ROJO para que sea muy visible
        borderTop: '3px solid #ff0000',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0.5rem',
        maxWidth: '28rem',
        margin: '0 auto'
      }}>
        {/* Texto de debug muy visible */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'yellow',
          color: 'black',
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: 'bold',
          borderRadius: '4px',
          zIndex: 100
        }}>
          🚨 EMERGENCY NAV ACTIVE
        </div>
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.75rem',
              transition: 'all 0.2s',
              minWidth: 0,
              flex: 1,
              color: isActive(item.href) ? '#2563EB' : '#CBD5E1',
              backgroundColor: isActive(item.href) ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
              textDecoration: 'none'
            }}
            aria-current={isActive(item.href) ? 'page' : undefined}
            aria-label={item.label}
          >
            {/* Icono */}
            <div style={{ position: 'relative', fontSize: '1.5rem' }}>
              {item.icon}
              
              {/* Badge */}
              {item.badge && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#E11D48',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            
            {/* Etiqueta */}
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              marginTop: '0.25rem',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}>
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}
