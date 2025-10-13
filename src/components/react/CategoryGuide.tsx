import React, { useState, useEffect } from 'react';

const CategoryGuide: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleShowGuide = () => {
      setIsVisible(true);
    };

    // Escuchar evento personalizado
    window.addEventListener('show-category-guide', handleShowGuide);

    return () => {
      window.removeEventListener('show-category-guide', handleShowGuide);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Remover el destaque de la categoría Comida
    const comidaCard = document.querySelector('[data-category="comida"]');
    if (comidaCard) {
      comidaCard.classList.remove('guide-highlight');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Overlay con blur */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm pointer-events-auto"
        onClick={handleClose}
      />
      
      {/* Contenedor de la guía - Posicionado más arriba para no tapar la categoría */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-4 pointer-events-none">
        {/* Towny Character */}
        <div 
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-cover bg-center bg-no-repeat z-10 animate-bounce"
          style={{ backgroundImage: `url('/towny/towny_brazos_extendidos_feliz.png')` }}
        />
        
        {/* Message Box - Más compacto */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 shadow-2xl border border-slate-600 pointer-events-auto">
          <h3 className="text-lg font-bold text-white text-center mb-2">
            🍔 Explora por Categorías
          </h3>
          <p className="text-gray-200 text-sm text-center mb-3 leading-snug">
            Prueba la categoría <strong className="text-blue-400">Comida</strong> para ver todos los productos disponibles.
          </p>
          
          {/* Button */}
          <button
            onClick={handleClose}
            className="w-full px-3 py-2 bg-towny text-white rounded-lg hover:bg-towny-dark transition-colors font-medium text-sm"
          >
            ¡Entendido!
          </button>
        </div>
      </div>

      {/* Estilos para el destaque */}
      <style>{`
        [data-category="comida"].guide-highlight {
          position: relative;
          z-index: 9999 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4) !important;
          animation: pulse-category 2s infinite;
          transform: scale(1.05);
          transition: all 0.3s ease;
        }
        
        @keyframes pulse-category {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.6);
          }
        }
        
        /* Asegurar que la categoría Comida esté visible por encima del overlay */
        [data-category="comida"].guide-highlight::before {
          content: '';
          position: absolute;
          inset: -8px;
          background: transparent;
          border-radius: inherit;
          pointer-events: none;
          z-index: -1;
        }
      `}</style>
    </div>
  );
};

export default CategoryGuide;
