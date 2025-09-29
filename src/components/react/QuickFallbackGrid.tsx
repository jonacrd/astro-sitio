import React, { useState, useEffect } from 'react';

interface QuickFallbackGridProps {
  onAddToCart?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  onContactService?: (serviceId: string) => void;
}

export default function QuickFallbackGrid({ onAddToCart, onViewProduct, onContactService }: QuickFallbackGridProps) {
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
      <section className="px-4 mb-6">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando productos destacados...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="max-w-[400px] mx-auto">
        {/* MOSAICO 2x2 RÁPIDO */}
        <div className="grid grid-cols-2 gap-2 [grid-auto-flow:dense] [grid-template-rows:auto_auto]">
          <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[3/4]">
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80"
              alt="Cachapa con Queso"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 rounded-full h-6 px-2 bg-red-600/90 text-white text-xs font-semibold flex items-center">
              Producto del Mes
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1 mb-1">
                Cachapa con Queso
              </h3>
              <p className="text-white/80 text-xs mb-1">Minimarket La Esquina</p>
              <p className="text-white text-lg font-extrabold mt-1">$3.500</p>
            </div>
            <button className="absolute left-2 bottom-2 rounded-full px-3 h-8 bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-500 active:scale-95 transition">
              Añadir al carrito
            </button>
          </div>
          
          <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80"
              alt="Asador de Pollo"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 rounded-full h-6 px-2 bg-red-600/90 text-white text-xs font-semibold flex items-center">
              Oferta Especial
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1 mb-1">
                Asador de Pollo
              </h3>
              <p className="text-white/80 text-xs mb-1">Restaurante El Buen Sabor</p>
              <p className="text-white text-lg font-extrabold mt-1">$8.000</p>
            </div>
            <button className="absolute left-2 bottom-2 rounded-full px-3 h-8 bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-500 active:scale-95 transition">
              Añadir al carrito
            </button>
          </div>
          
          <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&h=300&q=80"
              alt="Power Bank 10000mAh"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 rounded-full h-6 px-2 bg-red-600/90 text-white text-xs font-semibold flex items-center">
              Nuevo
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1 mb-1">
                Power Bank 10000mAh
              </h3>
              <p className="text-white/80 text-xs mb-1">TechStore Local</p>
              <p className="text-white text-lg font-extrabold mt-1">$15.000</p>
            </div>
            <button className="absolute left-2 bottom-2 rounded-full px-3 h-8 bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-500 active:scale-95 transition">
              Ver más
            </button>
          </div>
          
          <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[3/4] self-start">
            <img
              src="https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80"
              alt="Limpieza Profesional"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 rounded-full h-6 px-2 bg-red-600/90 text-white text-xs font-semibold flex items-center">
              Servicio Premium
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1 mb-1">
                Limpieza Profesional
              </h3>
              <p className="text-white/80 text-xs mb-1">CleanPro Services</p>
              <p className="text-white text-lg font-extrabold mt-1">$45.000</p>
            </div>
            <button className="absolute left-2 bottom-2 rounded-full px-3 h-8 bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-500 active:scale-95 transition">
              Contactar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}