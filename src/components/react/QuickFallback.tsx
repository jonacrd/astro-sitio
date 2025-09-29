import React, { useState, useEffect } from 'react';

interface QuickFallbackProps {
  className?: string;
}

export default function QuickFallback({ className = '' }: QuickFallbackProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Mostrar contenido después de 1 segundo
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80" 
          alt="Cachapa con Queso" 
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">Cachapa con Queso</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xl text-gray-900">$3.500</span>
            <span className="text-sm text-gray-500">Stock: 10</span>
          </div>
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
            Añadir al carrito
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80" 
          alt="Asador de Pollo" 
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">Asador de Pollo</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xl text-gray-900">$8.000</span>
            <span className="text-sm text-gray-500">Stock: 5</span>
          </div>
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  );
}