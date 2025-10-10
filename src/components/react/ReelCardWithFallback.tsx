import React, { useState, useRef, useEffect } from 'react';

interface ReelCardWithFallbackProps {
  mediaType: 'video' | 'image';
  src: string;
  sellerName: string;
  title: string;
  price: number;
  openNow: boolean;
  tags: string[];
  onAdd: () => void;
  onOpenStore: () => void;
  className?: string;
  fallbackAspect?: '4/5' | '9/16';
}

export default function ReelCardWithFallback({
  mediaType,
  src,
  sellerName,
  title,
  price,
  openNow,
  tags,
  onAdd,
  onOpenStore,
  className = '',
  fallbackAspect = '9/16'
}: ReelCardWithFallbackProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observer para autoplay de video
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.isIntersecting;
          const intersectionRatio = entry.intersectionRatio;
          
          setIsVisible(isIntersecting);
          
          // Solo autoplay si el card está ≥60% visible
          if (mediaType === 'video' && videoRef.current && mediaLoaded) {
            if (isIntersecting && intersectionRatio >= 0.6) {
              videoRef.current.play().catch(console.error);
              setIsPlaying(true);
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [mediaType, mediaLoaded]);

  // Manejar carga de media
  const handleMediaLoad = () => {
    setMediaLoaded(true);
    setMediaError(false);
  };

  const handleMediaError = () => {
    setMediaError(true);
    setMediaLoaded(false);
  };

  // Formatear precio
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
      className={`
        relative w-full aspect-[4/5] rounded-2xl overflow-hidden
        bg-surface border border-white/10
        transition-transform duration-300 ease-out
        ${isHovered ? 'scale-[1.015]' : 'scale-100'}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Media Container con fallback */}
      <div className="relative w-full h-full">
        {mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
            className="w-full h-full object-cover"
            style={{
              filter: 'contrast(1.05) saturate(1.05)'
            }}
          />
        ) : (
          <img
            src={src}
            alt={title}
            onLoad={handleMediaLoad}
            onError={handleMediaError}
            className="w-full h-full object-cover"
            style={{
              filter: 'contrast(1.05) saturate(1.05)'
            }}
          />
        )}

        {/* Fallback si media no carga */}
        {mediaError && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-muted flex items-center justify-center">
            <div className="text-center text-white/80">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm">Imagen no disponible</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!mediaLoaded && !mediaError && (
          <div className="absolute inset-0 bg-surface flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        )}

        {/* Grain Overlay para compensar baja calidad */}
        {mediaLoaded && !mediaError && (
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent" 
                 style={{
                   backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                   radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                   radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)`
                 }} />
          </div>
        )}

        {/* Gradiente negro 0→60% */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Overlays de contenido */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {/* Header con chip de estado */}
          <div className="flex justify-between items-start">
            <div className="flex-1" />
            {openNow && (
              <div className="bg-success/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                Abierto ahora
              </div>
            )}
          </div>

          {/* Footer con información */}
          <div className="space-y-3">
            {/* Precio grande */}
            <div className="text-2xl font-bold text-white drop-shadow-lg">
              {formatPrice(price)}
            </div>

            {/* Título (2 líneas máximo) */}
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow-md">
              {title}
            </h3>

            {/* Vendedor */}
            <p className="text-white/80 text-xs drop-shadow-sm">
              {sellerName}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    +{tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botones flotantes */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {/* Botón Agregar (pill) */}
          <button
            onClick={onAdd}
            className="bg-accent text-primary px-4 py-2 rounded-full text-sm font-medium shadow-card hover:bg-accent/90 transition-colors duration-200"
            aria-label={`Agregar ${title} al carrito`}
          >
            Agregar
          </button>

          {/* Botón Ver Tienda */}
          <button
            onClick={onOpenStore}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors duration-200"
            aria-label={`Ver tienda de ${sellerName}`}
          >
            Ver Tienda
          </button>
        </div>

        {/* Indicador de video (si es video) */}
        {mediaType === 'video' && (
          <div className="absolute top-4 left-4">
            <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-accent' : 'bg-white/60'}`} />
              {isPlaying ? 'Reproduciendo' : 'Pausado'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}












