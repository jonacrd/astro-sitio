// =============================================
// PRODUCT CARD - TARJETA DE PRODUCTO
// =============================================

import React, { useState, useRef, useEffect } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category?: string;
    seller?: {
      name: string;
      avatar?: string;
    };
    rating?: number;
    reviews_count?: number;
    isStopCard?: boolean;
  };
  onAddToCart: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  className?: string;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onViewProduct, 
  className = '' 
}: ProductCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para animaciones
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Si es StopCard, mostrar mensaje especial
  if (product.isStopCard) {
    return (
      <div 
        ref={cardRef}
        className={`bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4 text-center ${className} ${
          isVisible ? 'animate-fade-in-scale' : 'opacity-0 scale-95'
        }`}
      >
        <div className="text-2xl mb-2">🛍️</div>
        <h3 className="text-white font-bold text-lg mb-2">{product.message}</h3>
        <p className="text-white/70 text-sm">Explora más productos en nuestra tienda</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div 
      ref={cardRef}
      className={`bg-surface/30 rounded-lg overflow-hidden shadow-lg group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${className} ${
        isVisible ? 'animate-fade-in-scale' : 'opacity-0 scale-95'
      }`}
      onClick={() => onViewProduct(product.id)}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square overflow-hidden">
        {product.image_url ? (
          <>
            <img
              src={product.image_url}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-muted/20 flex items-center justify-center">
            <div className="text-4xl text-white/50">📦</div>
          </div>
        )}
        
        {/* Badge de categoría */}
        {product.category && (
          <span className="absolute top-2 left-2 bg-primary/80 text-white px-2 py-1 rounded-full text-xs font-medium">
            {product.category}
          </span>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4">
        {/* Información del vendedor */}
        {product.seller && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-muted/30 rounded-full flex items-center justify-center">
              {product.seller.avatar ? (
                <img 
                  src={product.seller.avatar} 
                  alt={product.seller.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs text-white/70">👤</span>
              )}
            </div>
            <span className="text-white/70 text-xs">{product.seller.name}</span>
          </div>
        )}

        {/* Título del producto */}
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Descripción */}
        {product.description && (
          <p className="text-white/70 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.rating!) ? 'fill-current' : 'fill-gray-500'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-white/60 text-xs">
              ({product.reviews_count || 0})
            </span>
          </div>
        )}

        {/* Precio y botón */}
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-xl">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            className="bg-accent text-primary px-4 py-2 rounded-lg font-medium hover:bg-accent/80 transition-colors"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}












