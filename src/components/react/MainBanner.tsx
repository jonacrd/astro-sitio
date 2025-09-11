import { useState, useEffect } from "react";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink?: string;
  gradient: string;
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
      subtitle:
        "ENCUENTRA SOLO MARCAS RECONOCIDAS - EL MEJOR PRECIO DEL MERCADO",
      ctaText: "Ver Ofertas",
      ctaLink: "/catalogo?filter=ofertas",
      gradient: "linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)",
    },
    {
      id: "slide2",
      title: "MODA DE DAMAS Y CABALLEROS",
      subtitle: "OSTER - THOMAS - 10 AÑOS DE GARANTÍA",
      ctaText: "Ver Colección",
      ctaLink: "/catalogo?filter=moda",
      gradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
    },
    {
      id: "slide3",
      title: "HERRAMIENTAS PROFESIONALES",
      subtitle: "MAKITA - DEWALT - CALIDAD GARANTIZADA",
      ctaText: "Ver Herramientas",
      ctaLink: "/catalogo?filter=herramientas",
      gradient: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
    },
    {
      id: "slide4",
      title: "ZAPATILLAS DEPORTIVAS",
      subtitle: "ADIDAS - NIKE - LA MEJOR CALIDAD",
      ctaText: "Ver Zapatillas",
      ctaLink: "/catalogo?filter=zapatillas",
      gradient: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
    },
    {
      id: "slide5",
      title: "ACCESORIOS DE MODA",
      subtitle: "MOCHILAS - LENTES - RELOJES - JOYERIA",
      ctaText: "Ver Accesorios",
      ctaLink: "/catalogo?filter=accesorios",
      gradient: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
    },
  ];

  const displaySlides = slides.length > 0 ? slides : defaultSlides;

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || displaySlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displaySlides.length, autoPlayInterval]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + displaySlides.length) % displaySlides.length,
    );
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (displaySlides.length === 0) {
    return null;
  }

  return (
    <section
      className={`relative w-full h-96 md:h-[500px] overflow-hidden mb-16 max-w-6xl mx-auto z-10 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      {displaySlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: slide.gradient }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20 flex items-center justify-center text-center text-white z-20">
            <div className="max-w-4xl px-5">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 drop-shadow-lg leading-tight">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl mb-8 drop-shadow-md">
                {slide.subtitle}
              </p>
              {slide.ctaLink ? (
                <a
                  href={slide.ctaLink}
                  className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white border-none px-10 py-4 rounded-full text-lg md:text-xl font-bold cursor-pointer transition-all duration-300 shadow-lg hover:from-red-600 hover:to-red-700 hover:-translate-y-1 hover:shadow-xl"
                >
                  {slide.ctaText}
                </a>
              ) : (
                <button className="bg-gradient-to-r from-red-500 to-red-600 text-white border-none px-10 py-4 rounded-full text-lg md:text-xl font-bold cursor-pointer transition-all duration-300 shadow-lg hover:from-red-600 hover:to-red-700 hover:-translate-y-1 hover:shadow-xl">
                  {slide.ctaText}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {displaySlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 text-white border-none w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer text-xl md:text-2xl transition-all duration-300 backdrop-blur-md hover:bg-white/30 hover:scale-110 z-30"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 text-white border-none w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer text-xl md:text-2xl transition-all duration-300 backdrop-blur-md hover:bg-white/30 hover:scale-110 z-30"
          >
            ›
          </button>
        </>
      )}

      {/* Indicators */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-30">
          {displaySlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full cursor-pointer transition-all duration-300 ${
                index === currentSlide
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
