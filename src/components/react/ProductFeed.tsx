import React from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  title: string;
  price: number;
  seller: string;
  images: string[];
  isVideo?: boolean;
  isOpen?: boolean;
  isExpress?: boolean;
}

interface ProductFeedProps {
  products?: Product[];
  onAddToCart: (productId: string) => void;
  onContact: (productId: string) => void;
}

export default function ProductFeed({ products = [], onAddToCart, onContact }: ProductFeedProps) {
  // Datos de ejemplo con imágenes reales
  const mockProducts: Product[] = [
    {
      id: '1',
      title: 'Cachapa con Queso',
      price: 3500,
      seller: 'Minimarket La Esquina',
      images: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=500&fit=crop'
      ],
      isOpen: true
    },
    {
      id: '2',
      title: 'Empanadas de Pollo',
      price: 2500,
      seller: 'Doña María',
      images: [
        'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=500&fit=crop'
      ],
      isOpen: false
    },
    {
      id: '3',
      title: 'Power Bank 10000mAh',
      price: 15000,
      seller: 'TechStore',
      images: [
        'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?w=400&h=500&fit=crop'
      ],
      isOpen: true
    },
    {
      id: '4',
      title: 'Perro Caliente Especial',
      price: 4000,
      seller: 'Ana Hot Dogs',
      images: [
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=500&fit=crop'
      ],
      isOpen: true,
      isExpress: true
    },
    {
      id: '5',
      title: 'Arepa Reina Pepiada',
      price: 3000,
      seller: 'Luis Arepas',
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=500&fit=crop'
      ],
      isOpen: false
    },
    {
      id: '6',
      title: 'Cable USB-C',
      price: 5000,
      seller: 'TechStore',
      images: [
        'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?w=400&h=500&fit=crop'
      ],
      isOpen: true
    }
  ];

  const displayProducts = products.length > 0 ? products : mockProducts;

  return (
    <section className="px-4 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4">Publicaciones de Vendedores</h3>
          
          {displayProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-white/70">No hay productos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {displayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onAddToCart={onAddToCart}
                  onContact={onContact}
                  className="animate-fade-in"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}




