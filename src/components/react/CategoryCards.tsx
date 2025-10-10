import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price_cents: number;
  seller_name: string;
  seller_id: string;
  category: string;
}

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  products: Product[];
  route: string;
}

export default function CategoryCards() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuración de categorías
  const categoryConfig = [
    {
      id: 'restaurantes',
      name: 'Restaurantes',
      icon: '🍽️',
      color: 'from-orange-500 to-red-500',
      route: '/categoria/restaurantes'
    },
    {
      id: 'minimarkets',
      name: 'Minimarkets',
      icon: '🏪',
      color: 'from-blue-500 to-cyan-500',
      route: '/categoria/minimarkets'
    },
    {
      id: 'medicinas',
      name: 'Medicinas',
      icon: '💊',
      color: 'from-green-500 to-emerald-500',
      route: '/categoria/medicinas'
    },
    {
      id: 'postres',
      name: 'Postres',
      icon: '🍰',
      color: 'from-pink-500 to-rose-500',
      route: '/categoria/postres'
    },
    {
      id: 'carniceria',
      name: 'Carnicería',
      icon: '🥩',
      color: 'from-red-600 to-red-800',
      route: '/categoria/carniceria'
    },
    {
      id: 'servicios',
      name: 'Servicios',
      icon: '🔧',
      color: 'from-purple-500 to-indigo-500',
      route: '/categoria/servicios'
    },
    {
      id: 'mascotas',
      name: 'Mascotas',
      icon: '🐕',
      color: 'from-yellow-500 to-orange-500',
      route: '/categoria/mascotas'
    },
    {
      id: 'ninos',
      name: 'Niños',
      icon: '🧸',
      color: 'from-cyan-500 to-blue-500',
      route: '/categoria/ninos'
    }
  ];

  // Cargar productos por categoría
  useEffect(() => {
    const loadCategoryProducts = async () => {
      try {
        setLoading(true);
        
        const categoriesWithProducts = await Promise.all(
          categoryConfig.map(async (config) => {
            try {
              // Buscar productos por categoría
              const response = await fetch(`/api/feed/products?category=${config.id}&limit=6`);
              const data = await response.json();
              
              if (data.success && data.products) {
                return {
                  ...config,
                  products: data.products.map((product: any) => ({
                    id: product.id,
                    title: product.title,
                    image_url: product.image_url || '/placeholder-product.jpg',
                    price_cents: product.price_cents,
                    seller_name: product.seller_name || 'Vendedor',
                    seller_id: product.seller_id,
                    category: product.category
                  }))
                };
              }
            } catch (error) {
              console.error(`Error cargando productos para ${config.name}:`, error);
            }
            
            // Fallback con productos de ejemplo si no hay datos
            return {
              ...config,
              products: [
                {
                  id: `${config.id}-1`,
                  title: `Producto ${config.name} 1`,
                  image_url: '/placeholder-product.jpg',
                  price_cents: 1000,
                  seller_name: 'Vendedor',
                  seller_id: 'seller-1',
                  category: config.id
                },
                {
                  id: `${config.id}-2`,
                  title: `Producto ${config.name} 2`,
                  image_url: '/placeholder-product.jpg',
                  price_cents: 1500,
                  seller_name: 'Vendedor',
                  seller_id: 'seller-2',
                  category: config.id
                },
                {
                  id: `${config.id}-3`,
                  title: `Producto ${config.name} 3`,
                  image_url: '/placeholder-product.jpg',
                  price_cents: 2000,
                  seller_name: 'Vendedor',
                  seller_id: 'seller-3',
                  category: config.id
                }
              ]
            };
          })
        );

        setCategories(categoriesWithProducts);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryProducts();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-white mb-6">Explora por Categoría</h2>
      
      {/* Layout dinámico inspirado en apps de delivery */}
      <div className="space-y-4">
        {/* Primera fila: Hero + 2 cards pequeñas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hero Card - Restaurantes (más grande) */}
          <div className="lg:col-span-2">
            <CategoryCard 
              category={categories[0]} 
              size="hero" 
              isFirst={true}
            />
          </div>
          
          {/* Cards pequeñas lado derecho */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:space-y-4">
            <CategoryCard 
              category={categories[1]} 
              size="small" 
            />
            <CategoryCard 
              category={categories[2]} 
              size="small" 
            />
          </div>
        </div>

        {/* Segunda fila: 3 cards medianas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CategoryCard 
            category={categories[3]} 
            size="medium" 
          />
          <CategoryCard 
            category={categories[4]} 
            size="medium" 
          />
          <div className="sm:col-span-2 lg:col-span-1">
            <CategoryCard 
              category={categories[5]} 
              size="medium" 
            />
          </div>
        </div>

        {/* Tercera fila: 2 cards grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryCard 
            category={categories[6]} 
            size="large" 
          />
          <CategoryCard 
            category={categories[7]} 
            size="large" 
          />
        </div>
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: CategoryData;
  size: 'hero' | 'large' | 'medium' | 'small';
  isFirst?: boolean;
}

function CategoryCard({ category, size, isFirst = false }: CategoryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Rotar imágenes cada 3 segundos
  useEffect(() => {
    if (category.products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => 
        prev === category.products.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [category.products.length]);

  const handleClick = () => {
    window.location.href = category.route;
  };

  // Configuración de tamaños
  const sizeConfig = {
    hero: {
      height: 'h-56 sm:h-64 lg:h-56',
      padding: 'p-4 sm:p-6',
      iconSize: 'text-4xl sm:text-5xl',
      titleSize: 'text-xl sm:text-2xl',
      badgeSize: 'text-sm',
      borderRadius: 'rounded-2xl'
    },
    large: {
      height: 'h-44 sm:h-48 lg:h-44',
      padding: 'p-4',
      iconSize: 'text-3xl',
      titleSize: 'text-lg sm:text-xl',
      badgeSize: 'text-xs',
      borderRadius: 'rounded-xl'
    },
    medium: {
      height: 'h-36 sm:h-40 lg:h-36',
      padding: 'p-3 sm:p-4',
      iconSize: 'text-2xl sm:text-3xl',
      titleSize: 'text-base sm:text-lg',
      badgeSize: 'text-xs',
      borderRadius: 'rounded-xl'
    },
    small: {
      height: 'h-28 sm:h-32 lg:h-28',
      padding: 'p-2 sm:p-3',
      iconSize: 'text-xl sm:text-2xl',
      titleSize: 'text-sm sm:text-base',
      badgeSize: 'text-xs',
      borderRadius: 'rounded-lg'
    }
  };

  const config = sizeConfig[size];

  return (
    <div 
      onClick={handleClick}
      className={`relative bg-gradient-to-br ${category.color} ${config.height} ${config.borderRadius} cursor-pointer overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border border-white/10 hover:border-white/20`}
    >
      {/* Imágenes de productos como fondo */}
      <div className="absolute inset-0 flex">
        {category.products.map((product, index) => (
          <div
            key={product.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg';
              }}
            />
            {/* Overlay dinámico según el tamaño */}
            <div className={`absolute inset-0 ${
              size === 'hero' ? 'bg-black/30' : 
              size === 'large' ? 'bg-black/40' : 
              'bg-black/50'
            }`}></div>
          </div>
        ))}
      </div>

      {/* Contenido de la card */}
      <div className={`relative z-10 h-full flex flex-col justify-between ${config.padding}`}>
        {/* Header con icono y badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`${config.iconSize} drop-shadow-lg`}>{category.icon}</span>
            {size === 'hero' && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white font-bold text-sm">DESTACADO</span>
              </div>
            )}
          </div>
          
          {/* Badge de cantidad de productos */}
          <div className="bg-white/20 backdrop-blur-sm text-white rounded-full px-2 py-1">
            <span className={`${config.badgeSize} font-medium`}>
              {category.products.length}
            </span>
          </div>
        </div>

        {/* Título y descripción */}
        <div className="space-y-1">
          <h3 className={`text-white font-bold ${config.titleSize} leading-tight drop-shadow-lg`}>
            {category.name}
          </h3>
          
          {size === 'hero' && (
            <p className="text-white/90 text-sm leading-tight drop-shadow-md">
              {category.id === 'restaurantes' ? 'Deliciosa comida preparada por los mejores chefs' :
               category.id === 'minimarkets' ? 'Todo lo que necesitas para tu hogar' :
               category.id === 'medicinas' ? 'Farmacias y productos de salud' :
               category.id === 'postres' ? 'Dulces y postres para endulzar tu día' :
               category.id === 'carniceria' ? 'Carnes frescas y productos cárnicos' :
               category.id === 'servicios' ? 'Servicios profesionales para tu hogar' :
               category.id === 'mascotas' ? 'Todo para el cuidado de tus mascotas' :
               'Productos y servicios para los más pequeños'}
            </p>
          )}
        </div>

        {/* Indicadores de slide para cards grandes */}
        {(size === 'hero' || size === 'large') && category.products.length > 1 && (
          <div className="flex justify-center gap-1">
            {category.products.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Botón de acción para hero */}
        {size === 'hero' && (
          <div className="flex justify-end">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-white font-medium text-sm">Explorar →</span>
            </div>
          </div>
        )}
      </div>

      {/* Efecto hover mejorado */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Partículas flotantes para cards grandes */}
      {(size === 'hero' || size === 'large') && (
        <>
          <div className="absolute top-4 right-8 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-12 right-12 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse delay-500"></div>
        </>
      )}
    </div>
  );
}
