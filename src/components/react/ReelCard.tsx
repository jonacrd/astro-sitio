import React, { useState, useRef, useEffect } from 'react';

interface ReelCardProps {
  mediaType: 'video' | 'image';
  src: string;
  title: string;
  sellerName: string;
  price: number;
  openNow?: boolean;
  tags?: string[];
  onAdd: () => void;
  onOpenStore: () => void;
  className?: string;
}

export default function ReelCard({
  mediaType,
  src,
  title,
  sellerName,
  price,
  openNow = false,
  tags = [],
  onAdd,
  onOpenStore,
  className = ''
}: ReelCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observer para autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);
        
        if (mediaType === 'video' && videoRef.current) {
          if (isIntersecting) {
            videoRef.current.play().catch(console.error);
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.6 } // 60% visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [mediaType]);

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
      className={`relative aspect-[4/5] rounded-2xl overflow-hidden card group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Container */}
      <div className="relative w-full h-full">
        {mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
            style={{
              filter: 'contrast(1.05) saturate(1.05)',
            }}
          />
        ) : (
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover"
            style={{
              filter: 'contrast(1.05) saturate(1.05)',
            }}
            loading="lazy"
          />
        )}

        {/* Grain Overlay para compensar baja calidad */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        </div>

        {/* Overlay Inferior con Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Chip "Abierto Ahora" */}
        {openNow && (
          <div className="absolute top-3 left-3">
            <span className="bg-success text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Abierto ahora
            </span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Contenido Inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Precio */}
          <div className="text-2xl font-bold text-white mb-2">
            {formatPrice(price)}
          </div>

          {/* Título */}
          <h3 className="text-white font-semibold mb-1 line-clamp-2">
            {title}
          </h3>

          {/* Vendedor */}
          <p className="text-white/80 text-sm mb-3">
            {sellerName}
          </p>

          {/* Botones Flotantes */}
          <div className="flex gap-2">
            <button
              onClick={onAdd}
              className="flex-1 bg-accent text-primary px-4 py-2 rounded-full font-medium hover:bg-accent/90 transition-all duration-200 hover:scale-105"
            >
              Añadir al carrito
            </button>
            <button
              onClick={onOpenStore}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium hover:bg-white/30 transition-all duration-200 hover:scale-105"
            >
              Ver tienda
            </button>
          </div>
        </div>

        {/* Indicador de Video */}
        {mediaType === 'video' && (
          <div className="absolute top-3 right-3">
            <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-accent' : 'bg-white/60'}`} />
              {isPlaying ? 'Reproduciendo' : 'Pausado'}
            </div>
          </div>
        )}
      </div>

      {/* Micro-animación en hover/touch */}
      <div
        className={`absolute inset-0 transition-transform duration-200 ${
          isHovered ? 'scale-[1.015]' : 'scale-100'
        }`}
      />
    </div>
  );
}