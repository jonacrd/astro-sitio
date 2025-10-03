import React, { useEffect, useState } from 'react';

interface CartToastProps {
  productName: string;
  productImage: string;
  onClose: () => void;
  onClick?: () => void;
}

export default function CartToast({ productName, productImage, onClose, onClick }: CartToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar con animación
    setTimeout(() => setIsVisible(true), 10);

    // Auto-cerrar después de 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    if (onClick) {
      onClick();
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  };

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
      style={{ maxWidth: '90vw' }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-green-500 ${
          onClick ? 'cursor-pointer hover:shadow-3xl hover:scale-105 transition-all' : ''
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Ícono de éxito animado */}
          <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Imagen del producto */}
          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 mb-1">
              ¡Agregado al carrito! 🎉
            </p>
            <p className="text-xs text-gray-600 truncate mb-1">
              {productName}
            </p>
            {onClick && (
              <p className="text-xs text-blue-600 font-medium">
                👆 Click para ver tu carrito
              </p>
            )}
          </div>

          {/* Botón cerrar */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evitar que se propague al contenedor
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-green-500 animate-progress"
            style={{
              animation: 'progress 3s linear forwards'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}

