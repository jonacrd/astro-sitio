import { useState, useEffect } from "react";

interface Product {
  id: number;
  name: string;
  priceCents: number;
  stock: number;
  imageUrl?: string;
}

interface CategorySection {
  id: string;
  name: string;
  products: Product[];
  color: string;
  gradient: string;
  icon: string;
}

interface CategoryCarouselProps {
  sections: CategorySection[];
  onAddToCart?: (productId: number) => void;
  onGoToCategory?: (categoryId: string) => void;
}

export default function CategoryCarousel({
  sections,
  onAddToCart,
  onGoToCategory,
}: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sections.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, sections.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sections.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + sections.length) % sections.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full py-20 px-5 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-30 z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='grain' width='100' height='100' patternUnits='userSpaceOnUse'><circle cx='25' cy='25' r='1' fill='%232c3e50' opacity='0.1'/><circle cx='75' cy='75' r='1' fill='%232c3e50' opacity='0.1'/><circle cx='50' cy='10' r='0.5' fill='%232c3e50' opacity='0.1'/><circle cx='10' cy='60' r='0.5' fill='%232c3e50' opacity='0.1'/><circle cx='90' cy='40' r='0.5' fill='%232c3e50' opacity='0.1'/></pattern></defs><rect width='100' height='100' fill='url(%23grain)'/></svg>")`,
        }}
      />

      {/* Header */}
      <div className="relative z-20 text-center mb-8 h-24">
        <h2 className="text-5xl font-bold text-gray-800 mb-4 drop-shadow-lg bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          🌟 MODA POR CATEGORÍAS
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Descubre las mejores colecciones de moda para cada estilo
        </p>
      </div>

      {/* Carousel Container */}
      <div
        className="relative max-w-2xl mx-auto overflow-hidden h-96 mb-16 px-5"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="flex transition-transform duration-700 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex-shrink-0 w-full bg-white rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-3xl mx-1 flex flex-col"
            >
              {/* Section Header */}
              <div
                className="p-10 text-center relative overflow-hidden flex-shrink-0"
                style={{
                  background: section.gradient,
                  height: "200px",
                }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ background: section.gradient }}
                />

                <span className="text-4xl mb-6 block drop-shadow-lg relative z-10">
                  {section.icon}
                </span>

                <h3 className="text-2xl font-bold text-white mb-5 drop-shadow-lg relative z-10 tracking-wider">
                  {section.name}
                </h3>

                <p className="text-xl text-white/95 mb-8 drop-shadow-md relative z-10 font-medium">
                  Los mejores productos para {section.name.toLowerCase()}
                </p>

                <button
                  onClick={() => onGoToCategory?.(section.id)}
                  className="bg-white/25 text-white border-2 border-white/40 px-8 py-4 rounded-full font-bold transition-all duration-300 backdrop-blur-md hover:bg-white/35 hover:border-white/60 hover:-translate-y-1 hover:shadow-lg relative z-10 text-lg uppercase tracking-wide"
                >
                  Ver Colección
                </button>
              </div>

              {/* Products Grid */}
              <div className="p-8 bg-gray-800/80 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-5">
                  {section.products.map((product) => {
                    const price = product.priceCents / 100;
                    const stockStatus =
                      product.stock === 0
                        ? "out"
                        : product.stock < 10
                          ? "low"
                          : "in-stock";
                    const stockText =
                      product.stock === 0
                        ? "Agotado"
                        : product.stock < 10
                          ? `Solo ${product.stock}`
                          : `${product.stock} disponibles`;

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg border border-gray-100"
                      >
                        <img
                          src={
                            product.imageUrl ||
                            "/images/placeholder-product.jpg"
                          }
                          alt={product.name}
                          className="w-full h-32 object-cover bg-gray-200 transition-transform duration-300 hover:scale-105"
                        />
                        <div className="p-4 text-center">
                          <h4 className="text-sm font-bold text-gray-800 mb-2 leading-tight">
                            {product.name}
                          </h4>
                          <p className="text-lg font-bold text-red-600 mb-2">
                            ${price.toFixed(2)}
                          </p>
                          <p
                            className={`text-xs font-semibold mb-3 ${
                              stockStatus === "in-stock"
                                ? "text-green-600"
                                : stockStatus === "low"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {stockText}
                          </p>
                          <button
                            onClick={() => onAddToCart?.(product.id)}
                            disabled={product.stock === 0}
                            className={`w-full py-2 px-3 rounded-2xl font-bold transition-all duration-300 text-sm ${
                              product.stock === 0
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5"
                            }`}
                          >
                            {product.stock === 0 ? "Agotado" : "Agregar"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-20 flex justify-center items-center gap-5 mt-10">
        <button
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="bg-gradient-to-r from-gray-700 to-gray-800 text-white border-none w-12 h-12 rounded-full cursor-pointer text-xl transition-all duration-300 flex items-center justify-center hover:from-gray-800 hover:to-gray-700 hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          ‹
        </button>

        <div className="flex gap-3">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                index === currentIndex
                  ? "bg-gray-800 scale-125"
                  : "bg-gray-400 hover:bg-gray-600"
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentIndex >= sections.length - 1}
          className="bg-gradient-to-r from-gray-700 to-gray-800 text-white border-none w-12 h-12 rounded-full cursor-pointer text-xl transition-all duration-300 flex items-center justify-center hover:from-gray-800 hover:to-gray-700 hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          ›
        </button>
      </div>
    </section>
  );
}
