import React from 'react';
import { UiCard } from './UiCard';
import { UiBadge } from './UiBadge';
import { ProductImage } from './ProductImage';
import { formatPrice } from '../../lib/money';

interface ProductCardSmallProps {
  id: string;
  title: string;
  price: number;
  seller: string;
  image: string;
  isNew?: boolean;
  isOffer?: boolean;
  onAddToCart: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  className?: string;
}

export function ProductCardSmall({
  id,
  title,
  price,
  seller,
  image,
  isNew = false,
  isOffer = false,
  onAddToCart,
  onViewProduct,
  className = ''
}: ProductCardSmallProps) {
  return (
    <UiCard variant="surface" className={`relative aspect-[4/5] overflow-hidden group ${className}`}>
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
      </div>
      
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {isNew && <UiBadge variant="accent">Nuevo</UiBadge>}
        {isOffer && <UiBadge variant="danger">Oferta</UiBadge>}
      </div>
      
      {/* Botón + */}
      <button
        onClick={() => onAddToCart(id)}
        className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-primary600 active:scale-95 transition-all"
        aria-label="Agregar al carrito"
      >
        +
      </button>
      
      {/* Contenido inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        {/* Precio */}
        <div className="text-xl font-bold text-white mb-2">
          {formatPrice(price)}
        </div>
        
        {/* Título */}
        <h3 className="text-white font-semibold mb-1 line-clamp-2">
          {title}
        </h3>
        
        {/* Vendedor */}
        <p className="text-white/80 text-sm mb-3">
          {seller}
        </p>
        
        {/* Botón Ver más */}
        <button
          onClick={() => onViewProduct(id)}
          className="w-full bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium hover:bg-white/30 transition-all duration-200"
        >
          Ver más
        </button>
      </div>
    </UiCard>
  );
}



