import React, { useState, useEffect } from 'react';

const SearchGuide: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleShowGuide = () => {
      setIsVisible(true);
    };

    // Escuchar evento personalizado
    window.addEventListener('show-search-guide', handleShowGuide);

    return () => {
      window.removeEventListener('show-search-guide', handleShowGuide);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay con blur */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm pointer-events-auto"
        onClick={handleClose}
      />
      
      {/* Contenedor de la guía */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 pointer-events-none">
        {/* Towny Character */}
        <div 
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-cover bg-center bg-no-repeat z-10 animate-bounce"
          style={{ backgroundImage: `url('/towny/towny_consigue_objetivo.png')` }}
        />
        
        {/* Message Box */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-2xl border border-slate-600 pointer-events-auto">
          <h3 className="text-xl font-bold text-white text-center mb-3">
            🔍 Buscador Inteligente
          </h3>
          <div className="text-gray-200 text-sm space-y-2 mb-4">
            <p className="text-center font-medium">
              Encuentra productos usando lenguaje natural:
            </p>
            <ul className="space-y-1 text-left">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span><strong>"perros calientes"</strong> - Busca por nombre</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span><strong>"comida rápida"</strong> - Busca por categoría</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span><strong>"bebidas frías"</strong> - Describe lo que necesitas</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span><strong>"algo dulce"</strong> - Usa palabras descriptivas</span>
              </li>
            </ul>
            <p className="text-center text-xs text-gray-400 mt-3 italic">
              ✨ Nuestro buscador corrige errores de tipeo automáticamente
            </p>
          </div>
          
          {/* Button */}
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ¡Entendido!
          </button>
        </div>
      </div>

      {/* Efecto de destaque en la barra de búsqueda */}
      <style>{`
        #main-search-input {
          position: relative;
          z-index: 10000;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          animation: pulse-search 2s infinite;
        }
        
        @keyframes pulse-search {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default SearchGuide;

