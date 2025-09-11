import { useState, useEffect } from "react";
import DotIndicators from "./DotIndicators";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink?: string;
  gradient: string;
  backgroundImage?: string;
}

interface MainBannerProps {
  slides?: BannerSlide[];
  autoPlayInterval?: number;
  className?: string;
}

export default function MainBanner({
  slides = [],
  autoPlayInterval = 5000,
  className = "",
}: MainBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Slides por defecto si no se proporcionan
  const defaultSlides: BannerSlide[] = [
    {
      id: "slide1",
      title: "¡LAS MEJORES MARCAS!",
      subtitle: "ENCUENTRA SOLO MARCAS RECONOCIDAS - EL MEJOR PRECIO DEL MERCADO",
      ctaText: "Ver Ofertas",
      ctaLink: "/catalogo?filter=ofertas",
      gradient: "linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)",
      backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&auto=format",
    },
    {
      id: "slide2",
      title: "MODA DE DAMAS Y CABALLEROS",
      subtitle: "OSTER - THOMAS - 10 AÑOS DE GARANTÍA",
      ctaText: "Ver Colección",
      ctaLink: "/catalogo?filter=moda",
      gradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
      backgroundImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=600&fit=crop&auto=format",
    },
    {
      id: "slide3",
      title: "HERRAMIENTAS PROFESIONALES",
      subtitle: "MAKITA - DEWALT - CALIDAD GARANTIZADA",
      ctaText: "Ver Herramientas",
      ctaLink: "/catalogo?filter=herramientas",
      gradient: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
      backgroundImage: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=600&fit=crop&auto=format",
    },
    {
      id: "slide4",
      title: "TECNOLOGÍA DE VANGUARDIA",
      subtitle: "SMARTPHONES - LAPTOPS - ACCESORIOS TECH",
      ctaText: "Ver Tecnología",
      ctaLink: "/catalogo?filter=tecnologia",
      gradient: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
      backgroundImage: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop&auto=format",
    },
  ];

  const bannerSlides = slides.length > 0 ? slides : defaultSlides;

  // Auto-play
  useEffect(() => {
    if (isAutoPlaying && bannerSlides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, bannerSlides.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000); // Reanudar auto-play después de 5s
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  if (bannerSlides.length === 0) {
    return null;
  }

  const currentSlideData = bannerSlides[currentSlide];

  return (
    <section 
      className={`relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden ${className}`}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Image */}
      {currentSlideData.backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${currentSlideData.backgroundImage})` }}
        />
      )}

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 opacity-80"
        style={{ background: currentSlideData.gradient }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center text-white">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 drop-shadow-lg">
              {currentSlideData.title}
            </h1>
            <p className="text-sm md:text-lg lg:text-xl mb-6 md:mb-8 max-w-3xl mx-auto drop-shadow-md">
              {currentSlideData.subtitle}
            </p>
            <a
              href={currentSlideData.ctaLink || "/catalogo"}
              className="inline-block bg-white text-gray-900 px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg h-10 md:h-11 text-sm md:text-base"
            >
              {currentSlideData.ctaText}
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile */}
      {bannerSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-black/20 hover:bg-black/30 text-white transition-all duration-200 items-center justify-center text-xs"
            aria-label="Slide anterior"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-black/20 hover:bg-black/30 text-white transition-all duration-200 items-center justify-center text-xs"
            aria-label="Slide siguiente"
          >
            ›
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {bannerSlides.length > 1 && (
        <div className="absolute bottom-3 inset-x-0">
          <DotIndicators
            total={bannerSlides.length}
            active={currentSlide}
            onDotClick={goToSlide}
            className="opacity-80"
          />
        </div>
      )}
    </section>
  );
}