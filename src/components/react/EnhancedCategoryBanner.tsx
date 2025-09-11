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
    small: "aspect-[4/3] md:aspect-[16/9]",
    medium: "aspect-[4/3] md:aspect-[16/9]",
    large: "aspect-[4/3] md:aspect-[16/9]",
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
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  return (
    <section className={`relative w-full ${aspectClasses[height]} overflow-hidden mb-8 ${className}`}>
      {/* Background Images with Transition */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentBgIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
          />
        </div>
      ))}

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-80`} />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Category Info */}
            <div className="text-white">
              <div className="text-4xl md:text-6xl mb-4 animate-bounce">{icon}</div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{title}</h2>
              <p className="text-white/90 text-sm md:text-base mb-6">
                {subtitle}
              </p>
              <a
                href={`/catalogo?category=${categorySlug || products[0]?.category?.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg h-10 md:h-11 text-sm md:text-base"
              >
                Ver Todo
              </a>
            </div>

            {/* Right Side - Products Carousel */}
            {products.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                <div className="flex overflow-hidden max-w-full">
                  {products.map((product, index) => {
                    const price = product.priceCents / 100;
                    const isOutOfStock = product.stock === 0;

                    return (
                      <div
                        key={product.id}
                        className={`flex-shrink-0 w-full transition-transform duration-500 ease-out ${
                          index === currentIndex
                            ? "translate-x-0"
                            : index < currentIndex
                              ? "-translate-x-full"
                              : "translate-x-full"
                        }`}
                        style={{
                          transform: `translateX(-${currentIndex * 100}%)`,
                        }}
                      >
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg">
                          <div className="flex gap-4">
                            {/* Product Image */}
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={
                                  product.imageUrl ||
                                  "/images/placeholder-product.jpg"
                                }
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/images/placeholder-product.jpg";
                                }}
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2 mb-1">
                                {product.name}
                              </h3>
                              <p className="text-blue-600 font-bold text-lg md:text-xl mb-2">
                                ${price.toFixed(2)}
                              </p>
                              <p className="text-xs md:text-sm text-gray-500 mb-3">
                                {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                              </p>
                              <button
                                onClick={() => addToCart(product.id)}
                                disabled={isOutOfStock}
                                className={`w-full py-2 px-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                                  isOutOfStock
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                                }`}
                              >
                                {isOutOfStock ? "Agotado" : "Agregar"}
                              </button>
                            </div>
                          </div>
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
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Dot Indicators */}
                {products.length > 1 && (
                  <div className="absolute bottom-3 inset-x-0">
                    <DotIndicators
                      total={products.length}
                      active={currentIndex}
                      onDotClick={(index) => {
                        setCurrentIndex(index);
                        setIsAutoPlaying(false);
                        setTimeout(() => setIsAutoPlaying(true), 5000);
                      }}
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