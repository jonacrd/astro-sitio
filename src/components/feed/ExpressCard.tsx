// =============================================
// EXPRESS CARD - TARJETA DE VENTA EXPRESS
// =============================================

import React, { useState, useRef, useEffect } from 'react';

interface ExpressCardProps {
  expressPost: {
    id: string;
    title: string;
    description?: string;
    price_cents?: number;
    category?: string;
    contact_method: string;
    contact_value: string;
    location_text?: string;
    created_at: string;
    expires_at: string;
    media?: Array<{
      url: string;
      media_type: 'image' | 'video';
      sort_order: number;
    }>;
    author?: {
      name: string;
      avatar?: string;
    };
  };
  onContact: (postId: string, contactMethod: string, contactValue: string) => void;
  onViewPost: (postId: string) => void;
  className?: string;
}

export default function ExpressCard({ 
  expressPost, 
  onContact, 
  onViewPost, 
  className = '' 
}: ExpressCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
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

  // Calcular tiempo restante
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const expires = new Date(expressPost.expires_at).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeRemaining('Expirado');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [expressPost.expires_at]);

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(priceCents);
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'whatsapp': return '📱';
      case 'telefono': return '📞';
      case 'email': return '📧';
      case 'directo': return '💬';
      default: return '📱';
    }
  };

  const getContactLabel = (method: string) => {
    switch (method) {
      case 'whatsapp': return 'WhatsApp';
      case 'telefono': return 'Teléfono';
      case 'email': return 'Email';
      case 'directo': return 'Directo';
      default: return 'Contactar';
    }
  };

  // Obtener imagen principal
  const mainImage = expressPost.media?.find(m => m.media_type === 'image' && m.sort_order === 0);

  return (
    <div 
      ref={cardRef}
      className={`bg-surface/30 rounded-lg overflow-hidden shadow-lg group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${className} ${
        isVisible ? 'animate-fade-in-scale' : 'opacity-0 scale-95'
      }`}
      onClick={() => onViewPost(expressPost.id)}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square overflow-hidden">
        {mainImage ? (
          <>
            <img
              src={mainImage.url}
              alt={expressPost.title}
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
            <div className="text-4xl text-white/50">🛒</div>
          </div>
        )}
        
        {/* Badge de tiempo restante */}
        <div className="absolute top-2 right-2 bg-red-500/80 text-white px-2 py-1 rounded-full text-xs font-medium">
          ⏰ {timeRemaining}
        </div>

        {/* Badge de categoría */}
        {expressPost.category && (
          <span className="absolute top-2 left-2 bg-primary/80 text-white px-2 py-1 rounded-full text-xs font-medium">
            {expressPost.category}
          </span>
        )}

        {/* Badge "Sin garantía" */}
        <div className="absolute bottom-2 left-2 bg-orange-500/80 text-white px-2 py-1 rounded-full text-xs font-medium">
          ⚠️ Sin garantía
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4">
        {/* Información del vendedor */}
        {expressPost.author && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-muted/30 rounded-full flex items-center justify-center">
              {expressPost.author.avatar ? (
                <img 
                  src={expressPost.author.avatar} 
                  alt={expressPost.author.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs text-white/70">👤</span>
              )}
            </div>
            <span className="text-white/70 text-xs">{expressPost.author.name}</span>
          </div>
        )}

        {/* Título del producto */}
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
          {expressPost.title}
        </h3>

        {/* Descripción */}
        {expressPost.description && (
          <p className="text-white/70 text-sm mb-3 line-clamp-2">
            {expressPost.description}
          </p>
        )}

        {/* Ubicación */}
        {expressPost.location_text && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-white/60 text-xs">📍</span>
            <span className="text-white/60 text-xs">{expressPost.location_text}</span>
          </div>
        )}

        {/* Precio y botón de contacto */}
        <div className="flex items-center justify-between">
          {expressPost.price_cents ? (
            <span className="text-white font-bold text-xl">
              {formatPrice(expressPost.price_cents)}
            </span>
          ) : (
            <span className="text-white/70 text-sm">Precio a convenir</span>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContact(expressPost.id, expressPost.contact_method, expressPost.contact_value);
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-1"
          >
            <span>{getContactIcon(expressPost.contact_method)}</span>
            <span>{getContactLabel(expressPost.contact_method)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}








