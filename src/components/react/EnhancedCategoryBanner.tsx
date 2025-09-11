import { useState, useEffect } from "react";
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

interface EnhancedCategoryBannerProps {
  title: string;
  subtitle: string;
  products: Product[];
  gradient: string;
  icon: string;
  backgroundImages: string[];
  height?: "small" | "medium" | "large";
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  categorySlug?: string;
}

export default function EnhancedCategoryBanner({
  title,
  subtitle,
  products,
  gradient,
  icon,
  backgroundImages,
  height = "medium",
  autoPlay = true,
  autoPlayInterval = 4000,
  className = "",
  categorySlug = "",
}: EnhancedCategoryBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  const aspectClasses = {
    small: "aspect-[3/2] md:aspect-[16/9]",
    medium: "aspect-[3/2] md:aspect-[16/9]", 
    large: "aspect-[3/2] md:aspect-[16/9]",
  };

  // Auto-play para productos
  useEffect(() => {
    if (isAutoPlaying && products.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, products.length, autoPlayInterval]);

  // Auto-play para imágenes de fondo
  useEffect(() => {
    if (backgroundImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [backgroundImages.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const addToCart = async (productId: number) => {
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
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  return (
    <section className={`relative w-full ${aspectClasses[height]} mb-6 ${className}`}>
      {/* Background Images with Transition */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === currentBgIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 ${gradient}`} />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center">
            {/* Left Side - Category Info */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl md:text-2xl">{icon}</span>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1">
                    {title}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {subtitle}
                  </p>
                </div>
              </div>

              <a
                href={`/catalogo?category=${categorySlug}`}
                className="inline-flex items-center justify-center px-4 py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm"
              >
                Ver Todo
              </a>
            </div>

            {/* Right Side - Products Carousel */}
            {products.length > 0 && (
              <div className="relative">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg">
                  {products.map((product, index) => {
                    const price = product.priceCents / 100;
                    const isOutOfStock = product.stock === 0;

                    if (index !== currentIndex) return null;

                    return (
                      <div key={product.id} className="flex gap-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.imageUrl || "/images/placeholder-product.jpg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                            {product.name}
                          </h3>
                          <p className="text-blue-600 font-bold text-base mb-1">
                            ${price.toFixed(2)}
                          </p>
                          <p className="text-gray-500 text-xs mb-2">
                            {isOutOfStock ? "Agotado" : `${product.stock} disponibles`}
                          </p>
                          <button
                            onClick={() => addToCart(product.id)}
                            className={`w-full py-1.5 px-3 rounded-lg font-medium text-xs transition-colors duration-200 ${
                              isOutOfStock
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                            disabled={isOutOfStock}
                          >
                            {isOutOfStock ? "Agotado" : "Agregar"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Arrows */}
                {products.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/30 text-white p-1 rounded-full transition-all duration-200 text-xs w-5 h-5 flex items-center justify-center"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/30 text-white p-1 rounded-full transition-all duration-200 text-xs w-5 h-5 flex items-center justify-center"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Dot Indicators */}
                {products.length > 1 && (
                  <div className="absolute -bottom-2 inset-x-0">
                    <DotIndicators
                      total={products.length}
                      active={currentIndex}
                      onDotClick={(index) => {
                        setCurrentIndex(index);
                        setIsAutoPlaying(false);
                        setTimeout(() => setIsAutoPlaying(true), 5000);
                      }}
                      className="opacity-50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}