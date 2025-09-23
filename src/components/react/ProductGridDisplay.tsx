import React from 'react';
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

interface ProductGridDisplayProps {
  products: Product[];
  title?: string;
  className?: string;
  variant?: 'small' | 'medium' | 'large';
  showSeller?: boolean;
}

export default function ProductGridDisplay({ 
  products, 
  title, 
  className = '',
  variant = 'medium',
  showSeller = true
}: ProductGridDisplayProps) {
  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-600 ${className}`}>
        <p>No hay productos disponibles en este momento.</p>
      </div>
    );
  }

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

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {title}
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
