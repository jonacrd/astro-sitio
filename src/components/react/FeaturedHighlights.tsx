import React, { useState, useRef, useEffect } from 'react';

interface HighlightItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  price?: number;
  discount?: string;
  category: string;
  isVideo?: boolean;
  badge?: string;
  seller?: string;
  rating?: number;
  reviews?: number;
}

interface FeaturedHighlightsProps {
  onAddToCart: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  onCategoryClick: (category: string) => void;
}

export default function FeaturedHighlights({ onAddToCart, onViewProduct, onCategoryClick }: FeaturedHighlightsProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Productos destacados reales
  const featuredProducts: HighlightItem[] = [
    {
      id: '1',
      title: 'Cachapa con Queso',
      subtitle: 'Tradicional venezolana',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=500&fit=crop',
      price: 3500,
      category: 'Comida',
      seller: 'Minimarket La Esquina',
      rating: 4.8,
      reviews: 24,
      badge: 'Más vendido'
    },
    {
      id: '2',
      title: 'Asador de Pollo',
      subtitle: 'Pollo entero asado',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=500&fit=crop',
      price: 8000,
      discount: '20% OFF',
      category: 'Comida',
      seller: 'Restaurante El Buen Sabor',
      rating: 4.9,
      reviews: 18,
      badge: 'Oferta Especial'
    },
    {
      id: '3',
      title: 'Power Bank 10000mAh',
      subtitle: 'Carga rápida USB-C',
      image: 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?w=400&h=500&fit=crop',
      price: 15000,
      category: 'Tecnología',
      seller: 'TechStore',
      rating: 4.7,
      reviews: 32,
      badge: 'Nuevo'
    },
    {
      id: '4',
      title: 'Empanadas de Pollo',
      subtitle: 'Frescas recién hechas',
      image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=500&fit=crop',
      price: 2500,
      category: 'Comida',
      seller: 'Doña María',
      rating: 4.6,
      reviews: 15,
      badge: 'Popular'
    },
    {
      id: '5',
      title: 'Servicio de Limpieza',
      subtitle: 'Limpieza a domicilio',
      image: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=400&h=500&fit=crop',
      price: 25000,
      category: 'Servicios',
      seller: 'Limpieza Express',
      rating: 4.9,
      reviews: 28,
      badge: 'Recomendado'
    },
    {
      id: '6',
      title: 'Reparación de Motos',
      subtitle: 'Mecánico especializado',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=500&fit=crop',
      price: 15000,
      category: 'Servicios',
      seller: 'Luis Mecánico',
      rating: 4.8,
      reviews: 22,
      badge: 'Especialista'
    }
  ];

  // Categorías destacadas
  const featuredCategories = [
    {
      id: 'comida',
      title: 'Comida',
      subtitle: 'Deliciosos platos',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
      icon: '🍽️',
      count: 45
    },
    {
      id: 'tecnologia',
      title: 'Tecnología',
      subtitle: 'Gadgets y accesorios',
      image: 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?w=300&h=200&fit=crop',
      icon: '📱',
      count: 23
    },
    {
      id: 'servicios',
      title: 'Servicios',
      subtitle: 'Profesionales locales',
      image: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=300&h=200&fit=crop',
      icon: '🔧',
      count: 18
    },
    {
      id: 'hogar',
      title: 'Hogar',
      subtitle: 'Decoración y muebles',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
      icon: '🏠',
      count: 31
    }
  ];

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3); // 3 slides
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 3);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 3) % 3);
  };

  return (
    <section className="px-4 mb-4">
      <div className="max-w-7xl mx-auto">
        {/* Productos Destacados */}
        <div className="bg-surface/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">⭐ Productos Destacados</h3>
            <button className="text-accent text-sm font-medium hover:text-accent/80 transition-colors">
              Ver todos
            </button>
          </div>
          
          <div 
            ref={sliderRef}
            className="relative overflow-hidden"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Slider Container */}
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {[0, 1, 2].map((slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-2 gap-3">
                    {featuredProducts.slice(slideIndex * 2, (slideIndex + 1) * 2).map((product) => (
                      <div 
                        key={product.id} 
                        className="bg-muted/30 rounded-lg overflow-hidden hover:bg-muted/40 transition-all duration-300 hover:scale-105 group"
                      >
                        {/* Imagen */}
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* Badge */}
                          {product.badge && (
                            <div className="absolute top-2 left-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.badge === 'Oferta Especial' ? 'badge-product-opaque' :
                                product.badge === 'Más vendido' ? 'badge-premium-opaque' :
                                product.badge === 'Nuevo' ? 'btn-primary-opaque' :
                                'badge-service-opaque'
                              }`}>
                                {product.badge}
                              </span>
                            </div>
                          )}
                          
                          {/* Precio */}
                          <div className="absolute bottom-2 left-2">
                            <div className="text-white font-bold text-lg">
                              {formatPrice(product.price!)}
                            </div>
                            {product.discount && (
                              <div className="text-red-400 text-xs font-medium">
                                {product.discount}
                              </div>
                            )}
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
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${i < Math.floor(product.rating!) ? 'text-yellow-400' : 'text-white/30'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-white/60 text-xs">
                              {product.rating} ({product.reviews})
                            </span>
                          </div>
                          
                          {/* Botón */}
                          <button
                            onClick={() => onAddToCart(product.id)}
                            className="w-full bg-accent text-primary py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm"
                          >
                            Añadir al carrito
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
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

            {/* Dots Indicators */}
            <div className="flex justify-center gap-1 mt-3">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-accent' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Categorías Destacadas */}
        <div className="bg-surface/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">🏷️ Categorías Destacadas</h3>
            <button className="text-accent text-sm font-medium hover:text-accent/80 transition-colors">
              Ver todas
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {featuredCategories.map((category) => (
              <div 
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className="bg-muted/30 rounded-lg overflow-hidden hover:bg-muted/40 transition-all duration-300 hover:scale-105 cursor-pointer group"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Icono */}
                  <div className="absolute top-2 left-2 text-2xl">
                    {category.icon}
                  </div>
                  
                  {/* Contenido */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <h4 className="text-white font-bold text-sm">{category.title}</h4>
                    <p className="text-white/80 text-xs">{category.subtitle}</p>
                    <p className="text-accent text-xs font-medium">{category.count} productos</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ofertas Especiales */}
        <div className="bg-surface/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">🔥 Ofertas Especiales</h3>
            <button className="text-accent text-sm font-medium hover:text-accent/80 transition-colors">
              Ver todas
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {featuredProducts.filter(p => p.discount).map((product) => (
              <div 
                key={product.id}
                className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg overflow-hidden hover:from-red-500/30 hover:to-orange-500/30 transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex">
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium text-sm mb-1">{product.title}</h4>
                        <p className="text-white/70 text-xs mb-2">{product.seller}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">{formatPrice(product.price!)}</span>
                          <span className="text-red-400 text-sm font-medium">{product.discount}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddToCart(product.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                      >
                        Aprovechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



