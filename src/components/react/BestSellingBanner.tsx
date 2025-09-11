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

interface BestSellingBannerProps {
  products: Product[];
  className?: string;
}

export default function BestSellingBanner({
  products,
  className = "",
}: BestSellingBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (isAutoPlaying && products.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, products.length]);

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
        const button = document.querySelector(
          `[data-product-id="${productId}"]`,
        ) as HTMLButtonElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = "¡Agregado!";
          button.classList.add("bg-green-500");
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove("bg-green-500");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section
      className={`py-16 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
            🔥 TRENDING
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Los Más Vendidos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Los productos que nuestros clientes más compran. ¡No te quedes sin
            el tuyo!
          </p>
        </div>

        {/* Products Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="flex overflow-hidden">
            {products.map((product, index) => {
              const price = product.priceCents / 100;
              const isOutOfStock = product.stock === 0;
              const isLowStock = product.stock > 0 && product.stock < 10;

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-full transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  <div className="bg-white rounded-2xl shadow-xl p-6 mx-4">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      {/* Product Image */}
                      <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={
                            product.imageUrl ||
                            "/images/placeholder-product.jpg"
                          }
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/placeholder-product.jpg";
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold mb-3">
                          ⭐ #{index + 1} Más Vendido
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                          {product.name}
                        </h3>

                        {product.category && (
                          <p className="text-gray-600 mb-4">
                            Categoría: {product.category.name}
                          </p>
                        )}

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                          <div className="text-3xl font-bold text-red-600">
                            ${price.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isOutOfStock
                                  ? "text-red-500"
                                  : isLowStock
                                    ? "text-orange-500"
                                    : "text-green-500"
                              }`}
                            >
                              {isOutOfStock
                                ? "Agotado"
                                : isLowStock
                                  ? `Solo ${product.stock} disponibles`
                                  : `${product.stock} disponibles`}
                            </span>
                            {isLowStock && !isOutOfStock && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">
                                ¡Últimas unidades!
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={isOutOfStock}
                          data-product-id={product.id}
                          className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                            isOutOfStock
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700 hover:scale-105 shadow-lg"
                          }`}
                        >
                          {isOutOfStock ? "Agotado" : "🔥 Agregar al Carrito"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          {products.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:shadow-xl text-gray-600 hover:text-red-600 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
              >
                ‹
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:shadow-xl text-gray-600 hover:text-red-600 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
              >
                ›
              </button>

            </>
          )}
        </div>
      </div>
    </section>
  );
}
