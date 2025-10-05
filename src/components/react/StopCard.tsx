import React from 'react';

interface StopCardProps {
  type: 'offers' | 'rewards' | 'shortcuts';
  data?: any;
  onAction?: (action: string) => void;
}

export default function StopCard({ type, data, onAction }: StopCardProps) {
  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action);
    }
  };

  if (type === 'offers') {
    return (
      <div className="card p-6 bg-gradient-to-r from-accent/20 to-accent/10 border-accent/30">
        <div className="text-center">
          <div className="text-3xl font-bold text-accent mb-2">
            {data?.countdown || "24:59:59"}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            ¡Ofertas Especiales!
          </h3>
          <p className="text-white/70 text-sm mb-4">
            Descuentos exclusivos por tiempo limitado
          </p>
          <button
            onClick={() => handleAction('view-offers')}
            className="bg-accent text-primary px-6 py-2 rounded-full font-medium hover:bg-accent/90 transition-colors duration-200"
          >
            Ver Ofertas
          </button>
        </div>
      </div>
    );
  }

  if (type === 'rewards') {
    const remaining = data?.remaining || 2500;
    const points = data?.points || 50;
    
    return (
      <div className="card p-6 bg-gradient-to-r from-success/20 to-success/10 border-success/30">
        <div className="text-center">
          <div className="text-2xl font-bold text-success mb-2">
            Te faltan ${remaining.toLocaleString()} para sumar {points} puntos hoy
          </div>
          <p className="text-white/70 text-sm mb-4">
            Acumula puntos y canjéalos por descuentos
          </p>
          <button
            onClick={() => handleAction('view-rewards')}
            className="bg-success text-white px-6 py-2 rounded-full font-medium hover:bg-success/90 transition-colors duration-200"
          >
            Ver Recompensas
          </button>
        </div>
      </div>
    );
  }

  if (type === 'shortcuts') {
    const shortcuts = [
      { id: 'orders', label: 'Pedidos', icon: '📦', action: 'view-orders' },
      { id: 'rewards', label: 'Recompensas', icon: '🎁', action: 'view-rewards' },
      { id: 'addresses', label: 'Direcciones', icon: '📍', action: 'view-addresses' }
    ];

    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              onClick={() => handleAction(shortcut.action)}
              className="flex flex-col items-center p-3 bg-surface/50 rounded-xl hover:bg-surface/70 transition-colors duration-200"
            >
              <span className="text-2xl mb-2">{shortcut.icon}</span>
              <span className="text-white text-xs font-medium text-center">
                {shortcut.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}









