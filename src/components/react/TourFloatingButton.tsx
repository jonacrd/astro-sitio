import React, { useState, useEffect } from 'react';

export default function TourFloatingButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Solo mostrar en la página principal
    const isMainPage = window.location.pathname === '/' || window.location.pathname === '/index';
    setShow(isMainPage);
  }, []);

  const handleStartTour = async () => {
    try {
      console.log('🎓 Iniciando tour desde botón flotante...');
      
      // Limpiar localStorage
      localStorage.removeItem('town_tour_v1_done');
      console.log('✅ LocalStorage limpiado');
      
      // Importar y forzar el inicio del tour DIRECTAMENTE
      const { startTour } = await import('../../lib/tour/TourManager');
      console.log('✅ TourManager importado');
      
      // Llamar directamente a startTour
      startTour();
      console.log('✅ Tour iniciado directamente');
    } catch (error) {
      console.error('❌ Error iniciando tour:', error);
      alert('Error al iniciar el tour: ' + error.message);
    }
  };

  if (!show) return null;

  return (
    <button
      onClick={handleStartTour}
      className="fixed bottom-24 right-6 z-[9999] w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
      title="Ver guía de uso"
      aria-label="Iniciar tour de bienvenida"
    >
      {/* Icono de pregunta/ayuda */}
      <svg 
        className="w-7 h-7 text-white" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.5" 
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      
      {/* Pulso animado */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
      
      {/* Tooltip */}
      <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Ver guía de uso
      </span>
    </button>
  );
}
