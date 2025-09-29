import React, { useState, useRef, useEffect } from 'react';

interface MediaItem {
  id: string;
  src: string;
  type: 'image' | 'video';
  alt?: string;
}

interface MediaCarouselProps {
  items: MediaItem[];
  autoplay?: boolean;
  showDots?: boolean;
  className?: string;
}

export default function MediaCarousel({ 
  items, 
  autoplay = true, 
  showDots = true,
  className = '' 
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Si solo hay 1 item, renderizar estático
  if (items.length <= 1) {
    const item = items[0];
    return (
      <div className={`relative w-full h-full ${className}`}>
        {item.type === 'video' ? (
          <video
            src={item.src}
            className="w-full h-full object-cover rounded-2xl"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={item.src}
            alt={item.alt || ''}
            className="w-full h-full object-cover rounded-2xl"
          />
        )}
      </div>
    );
  }

  // Autoplay
  useEffect(() => {
    if (isPlaying && items.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, items.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
    // Reanudar autoplay después de 5s
    setTimeout(() => setIsPlaying(true), 5000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div 
      ref={carouselRef}
      className={`relative w-full h-full overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Media Container */}
      <div className="relative w-full h-full">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {item.type === 'video' ? (
              <video
                src={item.src}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                autoPlay={index === currentIndex}
              />
            ) : (
              <img
                src={item.src}
                alt={item.alt || ''}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors duration-200"
        aria-label="Slide anterior"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors duration-200"
        aria-label="Slide siguiente"
      >
        ›
      </button>

      {/* Dots Indicators */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Indicator */}
      {items.length > 1 && (
        <div className="absolute top-3 right-3">
          <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-accent' : 'bg-white/60'}`} />
            {isPlaying ? 'Reproduciendo' : 'Pausado'}
          </div>
        </div>
      )}
    </div>
  );
}





