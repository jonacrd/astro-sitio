import React from 'react';
import { ProductCardLarge } from './ProductCardLarge';
import { ProductCardSmall } from './ProductCardSmall';

interface Product {
  id: string;
  title: string;
  price: number;
  seller: string;
  image: string;
  stock?: number;
  isNew?: boolean;
  isOffer?: boolean;
}

interface MasonryGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  className?: string;
}

export function MasonryGrid({
  products,
  onAddToCart,
  onViewProduct,
  className = ''
}: MasonryGridProps) {
  // Mostrar máximo 5 productos (1 grande + 4 pequeñas)
  const displayProducts = products.slice(0, 5);
  const [firstProduct, ...smallProducts] = displayProducts;
  
  return (
    <div className={`grid grid-cols-2 gap-3 [grid-auto-rows:8px] ${className}`}>
      {/* Primera tarjeta grande */}
      {firstProduct && (
        <div className="col-span-2">
          <ProductCardLarge
            id={firstProduct.id}
            title={firstProduct.title}
            price={firstProduct.price}
            seller={firstProduct.seller}
            image={firstProduct.image}
            stock={firstProduct.stock}
            isNew={firstProduct.isNew}
            isOffer={firstProduct.isOffer}
            onAddToCart={onAddToCart}
            onViewProduct={onViewProduct}
            style={{ maxHeight: '30vh' }}
          />
        </div>
      )}
      
      {/* Tarjetas pequeñas */}
      {smallProducts.map((product, index) => {
        // Calcular rowSpan basado en la altura del contenido
        const rowSpan = Math.round(200 / 8); // Aproximadamente 25 filas
        
        return (
          <div 
            key={product.id}
            className="break-inside-avoid"
            style={{ gridRow: `span ${rowSpan}` }}
          >
            <ProductCardSmall
              id={product.id}
              title={product.title}
              price={product.price}
              seller={product.seller}
              image={product.image}
              isNew={product.isNew}
              isOffer={product.isOffer}
              onAddToCart={onAddToCart}
              onViewProduct={onViewProduct}
            />
          </div>
        );
      })}
      
      {/* Fallback: Si hay problemas con masonry, usar grid simple */}
      {products.length === 0 && (
        <div className="col-span-2 text-center py-12 text-ink-muted">
          <p>No hay productos disponibles</p>
        </div>
      )}
    </div>
  );
}





