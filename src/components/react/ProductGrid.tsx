import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  productId: string;
  sellerId: string;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  priceCents: number;
  stock: number;
  sellerName: string;
  sellerPhone?: string;
  isOnline: boolean;
  delivery: boolean;
  updatedAt: string;
  productUrl: string;
  addToCartUrl: string;
}

interface ProductGridProps {
  category?: string;
  featured?: boolean;
  offers?: boolean;
  newProducts?: boolean;
  limit?: number;
  showSeller?: boolean;
  variant?: 'small' | 'medium' | 'large';
  title?: string;
  showTitle?: boolean;
}

export default function ProductGrid({
  category,
  featured = false,
  offers = false,
  newProducts = false,
  limit = 12,
  showSeller = true,
  variant = 'medium',
  title,
  showTitle = true
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [category, featured, offers, newProducts, limit]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (featured) params.append('featured', 'true');
      if (offers) params.append('offers', 'true');
      if (newProducts) params.append('new', 'true');
      params.append('limit', limit.toString());

      const response = await fetch(`/api/feed/real?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products || []);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGridClasses = () => {
    switch (variant) {
      case 'small':
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4';
      case 'large':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4';
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cents);
  };

  const getTitle = () => {
    if (title) return title;
    if (featured) return 'Productos Destacados';
    if (offers) return 'Ofertas Especiales';
    if (newProducts) return 'Productos Nuevos';
    if (category) return `Productos de ${category}`;
    return 'Productos';
  };

  if (loading) {
    return (
      <div className="w-full">
        {showTitle && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {getTitle()}
          </h2>
        )}
        <div className={getGridClasses()}>
          {Array.from({ length: Math.min(limit, 10) }).map((_, index) => (
            <div key={index}>
              <div className="rounded-2xl overflow-hidden bg-gray-700 animate-pulse mb-3">
                <div className="w-full aspect-square bg-gray-600"></div>
              </div>
              <div className="flex items-center justify-between px-1">
                <div className="h-5 bg-gray-600 rounded w-1/2 animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        {showTitle && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {getTitle()}
          </h2>
        )}
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Error al cargar productos</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadProducts}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full">
        {showTitle && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {getTitle()}
          </h2>
        )}
        <div className="text-center py-8">
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md max-w-md mx-auto">
            <h3 className="font-semibold mb-2">No hay productos disponibles</h3>
            <p className="text-sm">
              {category 
                ? `No se encontraron productos en la categoría "${category}"`
                : 'No hay productos disponibles en este momento'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showTitle && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {getTitle()}
        </h2>
      )}
      <div className={getGridClasses()}>
        {products.map((product) => (
          <div key={product.id} className="group">
            {/* Imagen con bordes redondeados */}
            <div className="relative rounded-2xl overflow-hidden mb-3">
              <img
                src={product.imageUrl || '/images/placeholder.jpg'}
                alt={product.title}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
              
              {/* Badge de vendedor arriba-izquierda (solo si showSeller es true) */}
              {showSeller && (
                <div className="absolute top-2 left-2">
                  <a 
                    href={`/vendedor/${product.sellerId}`}
                    className={`inline-flex h-6 px-2 rounded-full text-white text-[11px] font-semibold items-center gap-1 hover:scale-105 transition-all duration-200 cursor-pointer ${
                      product.isOnline 
                        ? 'bg-green-600/90' 
                        : 'bg-gray-600/90'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${product.isOnline ? 'bg-white' : 'bg-gray-300'}`}></span>
                    {product.sellerName}
                  </a>
                </div>
              )}

              {/* Badge de categoría o estado arriba-derecha */}
              <div className="absolute top-2 right-2">
                <span className="inline-flex h-6 px-2 rounded-full bg-rose-600/90 text-white text-[11px] font-semibold">
                  {product.category}
                </span>
              </div>

              {/* Overlay inferior con gradiente */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
                <h3 className="text-white text-[15px] font-semibold line-clamp-2">
                  {product.title}
                </h3>
              </div>
            </div>

            {/* Contenido inferior sin background */}
            <div className="flex items-center justify-between px-1">
              <p className="text-white text-[18px] font-extrabold">
                {formatPrice(product.priceCents)}
              </p>
              
              {/* Botón + a la derecha del precio */}
              <button
                onClick={(e) => {
                  // Animación del botón
                  const button = e.currentTarget;
                  button.classList.add('animate-bounce');
                  setTimeout(() => button.classList.remove('animate-bounce'), 500);
                  
                  // Navegar a la URL del carrito o del producto
                  if (product.addToCartUrl) {
                    window.location.href = product.addToCartUrl;
                  }
                }}
                disabled={!product.isOnline}
                className={`h-8 w-8 rounded-full text-white grid place-items-center transition-all duration-200 shadow-lg hover:shadow-xl ${
                  product.isOnline
                    ? 'bg-towny hover:bg-towny-light hover:scale-110 active:scale-95'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
                aria-label="Agregar al carrito"
              >
                <span className="text-xl font-bold leading-none">+</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}