import { useState, useEffect, useRef } from "react";
import DotIndicators from "./DotIndicators";

interface Product {
  id: number;
  name: string;
  priceCents: number;
  stock: number;
  imageUrl?: string;
  category?: {
    name: string;
  };
}

interface ProductCarouselProps {
  title?: string;
  subtitle?: string;
  products?: Product[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

export default function ProductCarousel({
  title = "Productos Destacados",
  subtitle = "Descubre nuestras mejores ofertas",
  products = [],
  autoPlay = true,
  autoPlayInterval = 4000,
  className = "",
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calcular cuántos slides necesitamos basado en el ancho de la pantalla
  const getSlidesCount = () => {
    if (typeof window === "undefined") return Math.ceil(products.length / 2);
    const width = window.innerWidth;
    if (width < 640) return products.length; // 1 por slide en mobile
    if (width < 768) return Math.ceil(products.length / 2); // 2 por slide
    if (width < 1024) return Math.ceil(products.length / 3); // 3 por slide
    return Math.ceil(products.length / 4); // 4 por slide
  };

  const [slidesCount, setSlidesCount] = useState(Math.ceil(products.length / 2)); // Valor por defecto consistente

  // Auto-play
  useEffect(() => {
    if (isAutoPlaying && products.length > 0 && slidesCount > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slidesCount);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, products.length, autoPlayInterval, slidesCount]);

  // Scroll al slide actual
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 280; // Ancho aproximado de cada card
      const gap = 16; // gap-4 = 16px
      const scrollPosition = currentIndex * (cardWidth + gap);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  // Calcular slidesCount inicial después de la hidratación
  useEffect(() => {
    setSlidesCount(getSlidesCount());
  }, [products.length]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setSlidesCount(getSlidesCount());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [products.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000); // Reanudar auto-play después de 5s
  };

  const addToCart = async (productId: number) => {
    const button = document.querySelector(
      `[data-product-id="${productId}"]`,
    ) as HTMLButtonElement;

    if (button) {
      button.disabled = true;
      button.textContent = "Agregando...";
    }

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        if (button) {
          button.textContent = "¡Agregado!";
          button.classList.add("bg-green-500");
          setTimeout(() => {
            button.textContent = "Agregar al carrito";
            button.classList.remove("bg-green-500");
            button.disabled = false;
          }, 2000);
        }

        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cart-updated'));
      } else {
        if (button) {
          button.textContent = "Error";
          button.classList.add("bg-red-500");
          setTimeout(() => {
            button.textContent = "Agregar al carrito";
            button.classList.remove("bg-red-500");
            button.disabled = false;
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (button) {
        button.textContent = "Error";
        button.classList.add("bg-red-500");
        setTimeout(() => {
          button.textContent = "Agregar al carrito";
          button.classList.remove("bg-red-500");
          button.disabled = false;
        }, 2000);
      }
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`py-10 md:py-14 lg:py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
            {title}
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Arrows - Hidden on mobile */}
          <button
            onClick={() => goToSlide((currentIndex - 1 + slidesCount) % slidesCount)}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-10 w-6 h-6 rounded-full bg-white/70 shadow-sm hover:bg-white transition-all duration-200 items-center justify-center text-gray-600 hover:text-gray-900 text-xs"
            aria-label="Slide anterior"
          >
            ‹
          </button>
          
          <button
            onClick={() => goToSlide((currentIndex + 1) % slidesCount)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-10 w-6 h-6 rounded-full bg-white/70 shadow-sm hover:bg-white transition-all duration-200 items-center justify-center text-gray-600 hover:text-gray-900 text-xs"
            aria-label="Slide siguiente"
          >
            ›
          </button>

          {/* Products Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scroller"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => {
              const price = product.priceCents / 100;
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className="snap-center shrink-0 w-[260px] sm:w-[280px] md:w-[300px]"
                >
                  <div className="group rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]">
                    {/* Product Image */}
                    <div className="aspect-[4/3] md:aspect-[16/10] w-full overflow-hidden bg-gray-100">
                      <img
                        src={
                          product.imageUrl ||
                          "/images/placeholder-product.jpg"
                        }
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="p-3 md:p-4">
                      <h3 className="font-medium text-gray-900 text-sm md:text-base line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-blue-600 font-semibold text-lg md:text-xl mb-2">
                        ${price.toFixed(2)}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 mb-3">
                        {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                      </p>
                      <button
                        data-product-id={product.id}
                        onClick={() => addToCart(product.id)}
                        disabled={isOutOfStock}
                        className={`w-full h-10 md:h-11 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
                          isOutOfStock
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
                        }`}
                      >
                        {isOutOfStock ? "Agotado" : "Agregar al carrito"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dot Indicators */}
          {slidesCount > 1 && (
            <div className="mt-4 md:mt-6">
              <DotIndicators
                total={slidesCount}
                active={currentIndex}
                onDotClick={goToSlide}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}