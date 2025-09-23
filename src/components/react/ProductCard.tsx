import React, { useState } from 'react';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: {
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
  };
  variant?: 'small' | 'medium' | 'large';
  showSeller?: boolean;
}

export default function ProductCard({ 
  product, 
  variant = 'medium', 
  showSeller = true 
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'small':
        return 'w-full max-w-xs';
      case 'large':
        return 'w-full max-w-md';
      default:
        return 'w-full max-w-sm';
    }
  };

  const getImageClasses = () => {
    switch (variant) {
      case 'small':
        return 'h-32';
      case 'large':
        return 'h-64';
      default:
        return 'h-48';
    }
  };

  return (
    <div className={`${getVariantClasses()} bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300`}>
      {/* Imagen del producto */}
      <div className={`${getImageClasses()} w-full bg-gray-200 relative`}>
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Badge de estado del vendedor */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {product.isOnline ? '🟢 Online' : '⚪ Offline'}
          </span>
        </div>

        {/* Badge de stock */}
        {product.stock < 5 && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Stock bajo
            </span>
          </div>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4">
        {/* Título y categoría */}
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
            {product.title}
          </h3>
          <p className="text-sm text-gray-500 capitalize">
            {product.category}
          </p>
        </div>

        {/* Descripción (solo en variante large) */}
        {variant === 'large' && product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Información del vendedor */}
        {showSeller && (
          <div className="mb-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Vendedor:</span> {product.sellerName}
            </p>
            {product.delivery && (
              <p className="text-xs text-green-600 mt-1">
                🚚 Entrega disponible
              </p>
            )}
          </div>
        )}

        {/* Precio y stock */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(product.priceCents)}
            </p>
            <p className="text-sm text-gray-500">
              Stock: {product.stock} unidades
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <a
            href={product.productUrl}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Ver detalles
          </a>
          <AddToCartButton
            productId={product.productId}
            sellerId={product.sellerId}
            sellerName={product.sellerName}
            title={product.title}
            price_cents={product.priceCents}
            stock={product.stock}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}