import React, { useState, useEffect } from 'react';
import AddToCartButton from './AddToCartButton';

interface Product {
  id: string;
  title: string;
  price_cents: number;
  image_url: string;
  seller_name: string;
  seller_id: string;
  stock: number;
  category: string;
}

export default function RealProductFeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🛍️ Cargando productos reales de Supabase...');
        setLoading(true);
        setError(null);

        // Usar el endpoint de feed que ya existe
        const response = await fetch('/api/feed/simple');
        const data = await response.json();

        if (data.success && data.data && data.data.products) {
          const products = data.data.products.map((item: any) => ({
            id: item.id,
            title: item.title,
            price_cents: item.price,
            image_url: item.image || '/img/placeholders/tecnologia.jpg',
            seller_name: item.sellerName || 'Vendedor',
            seller_id: item.sellerId,
            stock: item.stock || 0,
            category: item.category || 'General'
          }));

          setProducts(products);
          console.log('✅ Productos reales cargados:', products.length);
        } else {
          console.log('⚠️ No hay productos disponibles en la base de datos');
          setProducts([]);
        }
      } catch (err) {
        console.error('❌ Error cargando productos:', err);
        setError('Error cargando productos');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando productos reales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-500">No hay productos disponibles en la base de datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Productos Disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg';
              }}
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{product.seller_name}</p>
              <p className="text-blue-600 font-bold text-lg mb-2">
                $${(product.price_cents / 100).toLocaleString()}
              </p>
              <p className="text-green-600 text-sm mb-4">Stock: {product.stock} unidades</p>
              <AddToCartButton
                productId={product.id}
                title={product.title}
                price={product.price_cents / 100}
                image={product.image_url}
                sellerName={product.seller_name}
                sellerId={product.seller_id}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}