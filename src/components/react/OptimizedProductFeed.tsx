import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { useCart } from '../../hooks/useCart';

interface OptimizedProduct {
  id: string;
  title: string;
  image_url: string;
  price_cents: number;
  stock: number;
  seller_id: string;
}

interface OptimizedProductFeedProps {
  className?: string;
}

export default function OptimizedProductFeed({ className = '' }: OptimizedProductFeedProps) {
  const [products, setProducts] = useState<OptimizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('⚡ Cargando productos optimizados...');

      // CONSULTA OPTIMIZADA - Solo campos necesarios
      const { data, error: queryError } = await supabase
        .from('seller_products')
        .select(`
          seller_id,
          product_id,
          price_cents,
          stock,
          products!inner (
            id,
            title,
            image_url
          )
        `)
        .eq('active', true)
        .gt('stock', 0)
        .limit(8);

      if (queryError) {
        console.error('❌ Error cargando productos:', queryError);
        setError('Error cargando productos');
        setLoading(false);
        return;
      }

      console.log('📊 Productos encontrados:', data?.length || 0);

      if (data && data.length > 0) {
        // TRANSFORMACIÓN SIMPLE
        const transformedProducts: OptimizedProduct[] = data.map((item, index) => ({
          id: `opt-${index}-${Date.now()}`,
          title: item.products.title || 'Producto',
          image_url: item.products.image_url || 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80',
          price_cents: item.price_cents || 0,
          stock: item.stock || 0,
          seller_id: item.seller_id || ''
        }));

        setProducts(transformedProducts);
        console.log(`✅ Productos optimizados cargados: ${transformedProducts.length}`);
      } else {
        // PRODUCTOS DE EJEMPLO LIGEROS
        const fallbackProducts: OptimizedProduct[] = [
          {
            id: 'fallback-1',
            title: 'Cachapa con Queso',
            image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80',
            price_cents: 350000,
            stock: 10,
            seller_id: 'fallback-seller'
          },
          {
            id: 'fallback-2',
            title: 'Asador de Pollo',
            image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80',
            price_cents: 800000,
            stock: 5,
            seller_id: 'fallback-seller'
          }
        ];
        
        setProducts(fallbackProducts);
        console.log(`✅ Productos de fallback cargados: ${fallbackProducts.length}`);
      }

      setLoading(false);

    } catch (err) {
      console.error('❌ Error cargando productos:', err);
      setError('Error cargando productos');
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cents);
  };

  if (loading) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 text-red-500 ${className}`}>
        <p>Error: {error}</p>
        <button 
          onClick={loadProducts}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay productos disponibles</h3>
        <p className="text-gray-600">Los productos aparecerán aquí cuando estén disponibles.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {products.map(product => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src={product.image_url} 
            alt={product.title} 
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          <div className="p-4">
            <h3 className="font-bold text-lg mb-1">{product.title}</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-xl text-gray-900">
                {formatPrice(product.price_cents)}
              </span>
              <span className="text-sm text-gray-500">Stock: {product.stock}</span>
            </div>
            <button 
              onClick={async () => {
                const success = await addToCart(
                  product.id,
                  product.seller_id,
                  product.title,
                  product.price_cents,
                  1,
                  product.image_url
                );
                
                if (success) {
                  console.log('✅ Producto agregado al carrito:', product.title);
                } else {
                  console.error('❌ Error agregando al carrito:', product.title);
                }
              }}
              disabled={cartLoading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cartLoading ? 'Agregando...' : 'Añadir al carrito'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}