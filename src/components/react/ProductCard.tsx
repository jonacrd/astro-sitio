import React, { useState, useRef, useEffect } from 'react';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  seller: string;
  images: string[];
  isVideo?: boolean;
  isOpen?: boolean;
  onAddToCart: (productId: string) => void;
  onContact: (productId: string) => void;
  isExpress?: boolean;
  className?: string;
}

export default function ProductCard({
  id,
  title,
  price,
  seller,
  images,
  isVideo = false,
  isOpen = false,
  onAddToCart,
  onContact,
  isExpress = false,
  className = ''
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observer para autoplay de videos
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);
        
        if (isVideo && videoRef.current) {
          if (isIntersecting) {
            videoRef.current.play().catch(console.error);
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.6 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [isVideo]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      ref={cardRef}
      className={`relative aspect-[4/5] rounded-2xl overflow-hidden card group ${className}`}
    >
      {/* Media Container */}
      <div className="relative w-full h-full">
        {isVideo ? (
          <video
            ref={videoRef}
            src={images[0]}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
            style={{ filter: 'contrast(1.05) saturate(1.05)' }}
          />
        ) : (
          <img
            src={images[currentImageIndex]}
            alt={title}
            className="w-full h-full object-cover"
            style={{ filter: 'contrast(1.05) saturate(1.05)' }}
            loading="lazy"
          />
        )}

        {/* Slider Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            >
              ›
            </button>
          </>
        )}

        {/* Dots indicadores */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Overlay Inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isOpen && (
            <span className="bg-success text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Abierto ahora
            </span>
          )}
          {isExpress && (
            <span className="bg-accent text-primary px-2 py-1 rounded-full text-xs font-medium">
              Express 24h
            </span>
          )}
        </div>

        {/* Indicador de video */}
        {isVideo && (
          <div className="absolute top-3 right-3">
            <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-accent' : 'bg-white/60'}`} />
              {isPlaying ? 'Reproduciendo' : 'Pausado'}
            </div>
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
            {seller}
          </p>

          {/* Botones */}
          <div className="flex gap-2">
            {isExpress ? (
              <button
                onClick={() => onContact(id)}
                className="flex-1 bg-accent text-primary px-4 py-2 rounded-full font-medium hover:bg-accent/90 transition-all duration-200 hover:scale-105"
              >
                Contactar
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(id)}
                className="flex-1 bg-accent text-primary px-4 py-2 rounded-full font-medium hover:bg-accent/90 transition-all duration-200 hover:scale-105"
              >
                Añadir al carrito
              </button>
            )}
            <button
              onClick={() => onContact(id)}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium hover:bg-white/30 transition-all duration-200 hover:scale-105"
            >
              Ver más
            </button>
          </div>
        </div>
      </div>

      {/* Micro-animación en hover */}
      <div className="absolute inset-0 transition-transform duration-200 group-hover:scale-[1.015]" />
    </div>
  );
}