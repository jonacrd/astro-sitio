import { useState, useEffect } from "react";

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
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  // Responsive items per view - simplified
  const getItemsPerView = () => {
    if (typeof window === "undefined") return 2;
    const width = window.innerWidth;
    if (width < 640) return 1.2;
    if (width < 768) return 2;
    if (width < 1024) return 3;
    return 4;
  };

  const [itemsPerView, setItemsPerView] = useState(() => {
    if (typeof window === "undefined") return 2;
    return getItemsPerView();
  });
  
  const maxIndex = Math.max(0, products.length - Math.floor(itemsPerView));

  // Update items per view on resize - optimized
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newItemsPerView = getItemsPerView();
        setItemsPerView(newItemsPerView);
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || products.length <= Math.floor(itemsPerView)) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length, itemsPerView, maxIndex, autoPlayInterval]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const diff = startX - currentX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const diff = startX - currentX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    setIsDragging(false);
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

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 sm:py-12 lg:py-16 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            {title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Carousel - Always visible */}
        <div
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Products Track */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            {products.map((product) => {
              const price = product.priceCents / 100;
              const isOutOfStock = product.stock === 0;
              const isLowStock = product.stock > 0 && product.stock < 10;

              return (
                <div
                  key={product.id}
                  className={`flex-shrink-0 px-2 sm:px-3 ${
                    itemsPerView === 1.2
                      ? "w-[83.33%]" // 100/1.2
                      : itemsPerView === 2
                        ? "w-1/2"
                        : itemsPerView === 3
                          ? "w-1/3"
                          : "w-1/4"
                  }`}
                >
                  <a
                    href={`/catalogo?pid=${product.id}`}
                    className="group rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98] block"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                      <img
                        src={
                          product.imageUrl || "/images/placeholder-product.jpg"
                        }
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm">
                            AGOTADO
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-4">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-blue-600 font-semibold text-sm sm:text-base mb-2">
                        ${price.toFixed(2)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-3">
                        {isOutOfStock
                          ? "Agotado"
                          : isLowStock
                            ? `Solo ${product.stock}`
                            : `${product.stock} disponibles`}
                      </p>
                       <button
                         onClick={(e) => {
                           e.preventDefault();
                           addToCart(product.id);
                         }}
                         disabled={isOutOfStock}
                         data-product-id={product.id}
                         className={`w-full min-h-11 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                           isOutOfStock
                             ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                             : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
                         }`}
                       >
                         {isOutOfStock ? "Agotado" : "Agregar al carrito"}
                       </button>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          {products.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-1 sm:left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:shadow-xl text-gray-600 hover:text-blue-600 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
              >
                ‹
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-1 sm:right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:shadow-xl text-gray-600 hover:text-blue-600 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
              >
                ›
              </button>
            </>
          )}

          {/* Indicators */}
          {products.length > itemsPerView && (
            <div className="flex justify-center mt-4 sm:mt-6 lg:mt-8 space-x-2">
              {Array.from({ length: maxIndex + 1 }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-blue-600 scale-125"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
