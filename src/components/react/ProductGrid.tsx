import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

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
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    }
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
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
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
          <ProductCard
            key={product.id}
            product={product}
            variant={variant}
            showSeller={showSeller}
          />
        ))}
      </div>
    </div>
  );
}