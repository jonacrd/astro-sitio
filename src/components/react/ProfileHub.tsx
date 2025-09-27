import React from 'react';

interface ProfileHubProps {
  userType: 'buyer' | 'seller';
  onNavigate: (path: string) => void;
}

export default function ProfileHub({ userType, onNavigate }: ProfileHubProps) {
  const buyerSections = [
    {
      id: 'orders',
      title: 'Mis Pedidos',
      subtitle: 'Gestiona tus compras',
      icon: '📦',
      path: '/mis-pedidos'
    },
    {
      id: 'rewards',
      title: 'Recompensas',
      subtitle: 'Puntos y descuentos',
      icon: '🎁',
      path: '/recompensas'
    },
    {
      id: 'addresses',
      title: 'Direcciones',
      subtitle: 'Gestiona tus direcciones',
      icon: '📍',
      path: '/direcciones'
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      subtitle: 'Mantente informado',
      icon: '🔔',
      path: '/notificaciones'
    }
  ];

  const sellerSections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Panel de control',
      icon: '📊',
      path: '/dashboard'
    },
    {
      id: 'orders',
      title: 'Pedidos por Entregar',
      subtitle: 'Gestiona tus ventas',
      icon: '📋',
      path: '/dashboard/pedidos'
    },
    {
      id: 'catalog',
      title: 'Catálogo',
      subtitle: 'Gestiona tus productos',
      icon: '📚',
      path: '/dashboard/productos'
    },
    {
      id: 'rewards',
      title: 'Recompensas',
      subtitle: 'Sistema de puntos',
      icon: '🎁',
      path: '/dashboard/recompensas'
    },
    {
      id: 'profile',
      title: 'Editar Perfil',
      subtitle: 'Información personal',
      icon: '👤',
      path: '/perfil'
    }
  ];

  const sections = userType === 'seller' ? sellerSections : buyerSections;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          {userType === 'seller' ? 'Panel de Vendedor' : 'Mi Perfil'}
        </h2>
        <p className="text-white/70">
          {userType === 'seller' 
            ? 'Gestiona tu negocio y ventas' 
            : 'Gestiona tu cuenta y compras'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onNavigate(section.path)}
            className="card p-6 text-left hover:bg-surface/90 transition-colors duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {section.title}
                </h3>
                <p className="text-white/70 text-sm">
                  {section.subtitle}
                </p>
              </div>
              <div className="text-white/40 group-hover:text-white/60 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats para vendedores */}
      {userType === 'seller' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Resumen Rápido
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">0</div>
              <div className="text-white/70 text-sm">Pedidos Hoy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">$0</div>
              <div className="text-white/70 text-sm">Ventas Hoy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




