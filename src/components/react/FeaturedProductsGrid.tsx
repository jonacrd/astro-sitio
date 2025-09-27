import React, { useState, useRef, useEffect } from 'react';

interface FeaturedProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
  isSpecial?: boolean;
  discount?: string;
  category: string;
  isVideo?: boolean;
}

interface FeaturedProductsGridProps {
  products?: FeaturedProduct[];
  onAddToCart: (productId: string) => void;
  onContact: (productId: string) => void;
}

export default function FeaturedProductsGrid({ products = [], onAddToCart, onContact }: FeaturedProductsGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Productos destacados de ejemplo
  const mockProducts: FeaturedProduct[] = [
    {
      id: '1',
      title: 'Cachapa con Queso',
      price: 3500,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=500&fit=crop',
      seller: 'Minimarket La Esquina',
      category: 'Comida',
      isSpecial: false
    },
    {
      id: '2',
      title: 'Asador de Pollo',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=500&fit=crop',
      seller: 'Restaurante El Buen Sabor',
      category: 'Comida',
      isSpecial: true,
      discount: '20% DCTO. EN TODOS LOS PRODUCTOS!'
    },
    {
      id: '3',
      title: 'Power Bank 10000mAh',
      price: 15000,
      image: 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?w=400&h=500&fit=crop',
      seller: 'TechStore',
      category: 'Tecnología',
      isSpecial: false
    },
    {
      id: '4',
      title: 'Empanadas de Pollo',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=500&fit=crop',
      seller: 'Doña María',
      category: 'Comida',
      isSpecial: false
    }
  ];

  const displayProducts = products.length > 0 ? products : mockProducts;

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying || displayProducts.length <= 2) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (displayProducts.length - 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayProducts.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % (displayProducts.length - 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + (displayProducts.length - 1)) % (displayProducts.length - 1));
  };

  if (displayProducts.length === 0) {
    return (
      <section className="px-4 mb-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">Productos Destacados</h3>
            <div className="text-center py-6">
              <div className="text-4xl mb-2">⭐</div>
              <p className="text-white/60 text-sm">No hay productos destacados</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-surface/30 rounded-xl p-4">
          <h3 className="text-lg font-bold text-white mb-3">Productos Destacados</h3>
          
          <div 
            ref={sliderRef}
            className="relative overflow-hidden"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Slider Container */}
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 50}%)` }}
            >
              {displayProducts.map((product) => (
                <div key={product.id} className="w-1/2 flex-shrink-0 px-1">
                  <div className="bg-muted/30 rounded-lg overflow-hidden hover:bg-muted/40 transition-all duration-300 hover:scale-105 group">
                    {/* Imagen */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* Overlay inferior */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Badge especial */}
                      {product.isSpecial && (
                        <div className="absolute top-2 left-2">
                          <span className="badge-product-opaque px-2 py-1 rounded-full text-xs font-medium">
                            Oferta Especial
                          </span>
                        </div>
                      )}
                      
                      {/* Precio */}
                      <div className="absolute bottom-2 left-2">
                        <div className="text-white font-bold text-lg">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenido */}
                    <div className="p-3">
                      <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
                        {product.title}
                      </h4>
                      <p className="text-white/70 text-xs mb-2">
                        {product.seller}
                      </p>
                      
                      {/* Descuento */}
                      {product.discount && (
                        <p className="text-accent text-xs font-medium mb-2">
                          {product.discount}
                        </p>
                      )}
                      
                      {/* Botón */}
                      <button
                        onClick={() => onAddToCart(product.id)}
                        className="w-full bg-accent text-primary py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm"
                      >
                        Añadir al carrito
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {displayProducts.length > 2 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  ‹
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  ›
                </button>
              </>
            )}

            {/* Dots Indicators */}
            {displayProducts.length > 2 && (
              <div className="flex justify-center gap-1 mt-3">
                {Array.from({ length: displayProducts.length - 1 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-accent' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}



