import React from 'react';
import { UiCard } from './UiCard';
import { UiButton } from './UiButton';
import { UiBadge } from './UiBadge';
import { ProductImage } from './ProductImage';
import { formatPrice } from '../../lib/money';

interface ProductCardLargeProps {
  id: string;
  title: string;
  price: number;
  seller: string;
  image: string;
  stock?: number;
  isNew?: boolean;
  isOffer?: boolean;
  onAddToCart: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  className?: string;
}

export function ProductCardLarge({
  id,
  title,
  price,
  seller,
  image,
  stock = 0,
  isNew = false,
  isOffer = false,
  onAddToCart,
  onViewProduct,
  className = ''
}: ProductCardLargeProps) {
  return (
    <UiCard variant="paper" className={`p-4 max-h-[30vh] ${className}`}>
      {/* Imagen */}
      <div className="mb-4">
        <ProductImage 
          src={image} 
          alt={title}
          aspectRatio="video"
          className="w-full"
        />
      </div>
      
      {/* Badges */}
      <div className="flex gap-2 mb-3">
        {isNew && <UiBadge variant="accent">Nuevo</UiBadge>}
        {isOffer && <UiBadge variant="danger">Oferta</UiBadge>}
      </div>
      
      {/* Contenido */}
      <div className="space-y-3">
        {/* Título */}
        <h3 className="font-semibold text-ink-inverse line-clamp-2">
          {title}
        </h3>
        
        {/* Vendedor */}
        <p className="text-sm text-ink-muted">
          {seller}
        </p>
        
        {/* Precio y Stock */}
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-ink-inverse">
            {formatPrice(price)}
          </span>
          {stock > 0 && (
            <UiBadge variant="success">
              Stock: {stock}
            </UiBadge>
          )}
        </div>
        
        {/* Botones */}
        <div className="flex gap-2">
          <UiButton 
            variant="primary" 
            className="flex-1"
            onClick={() => onAddToCart(id)}
          >
            Agregar al carrito
          </UiButton>
          <UiButton 
            variant="secondary" 
            onClick={() => onViewProduct(id)}
          >
            Ver más
          </UiButton>
        </div>
      </div>
    </UiCard>
  );
}
