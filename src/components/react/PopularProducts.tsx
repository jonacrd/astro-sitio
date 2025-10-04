import React, { useEffect, useState } from 'react';
import FeedTileBig from './FeedTileBig';

export default function PopularProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de productos populares
    const mockPopularProducts = [
      { type: 'product', sellerId: 's1', sellerProductId: 'sp1', title: 'Perro Caliente Premium', priceCents: 2500, imageUrl: null, category: 'comida', sellerActive: true, stock: 15, delivery: '30 min' },
      { type: 'product', sellerId: 's2', sellerProductId: 'sp2', title: 'Hamburguesa Artesanal', priceCents: 4500, imageUrl: null, category: 'comida', sellerActive: true, stock: 8, delivery: '25 min' },
      { type: 'product', sellerId: 's3', sellerProductId: 'sp3', title: 'Pizza Margherita', priceCents: 5500, imageUrl: null, category: 'comida', sellerActive: true, stock: 12, delivery: '35 min' },
      { type: 'product', sellerId: 's4', sellerProductId: 'sp4', title: 'Cerveza Artesanal', priceCents: 2200, imageUrl: null, category: 'cervezas', sellerActive: true, stock: 20, delivery: '20 min' },
      { type: 'product', sellerId: 's5', sellerProductId: 'sp5', title: 'Corte de Cabello Premium', priceCents: 12000, imageUrl: null, category: 'peluqueria', sellerActive: true, stock: 5, delivery: '45 min' },
      { type: 'product', sellerId: 's6', sellerProductId: 'sp6', title: 'Empanadas Venezolanas', priceCents: 2000, imageUrl: null, category: 'comida', sellerActive: false, stock: 0, delivery: 'No disponible' }
    ];
    
    setTimeout(() => {
      setProducts(mockPopularProducts.slice(0, 6));
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Productos Populares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Productos Populares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, index) => (
            <div key={index} className="relative">
              <FeedTileBig item={product} />
              {/* Indicador de estado del vendedor */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.sellerActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.sellerActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {/* Info de stock y delivery */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                  <div>Stock: {product.stock}</div>
                  <div>Entrega: {product.delivery}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}








