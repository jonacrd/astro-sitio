import React, { useState, useEffect } from 'react';
import AddToCartButton from './AddToCartButton';
import { supabase } from '../../lib/supabase-browser';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  price_cents: number;
  stock: number;
  seller_id: string;
  seller_name: string;
  seller_avatar: string;
  created_at: string;
  is_featured: boolean;
  sales_count: number;
}

interface ProductFeedSimpleProps {
  className?: string;
}

export default function ProductFeedSimple({ className = '' }: ProductFeedSimpleProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'featured' | 'cheapest' | 'popular'>('all');
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    loadProducts();
  }, [filter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🛍️ Cargando productos reales...');

      // Consulta simplificada para productos activos
      const { data, error: queryError } = await supabase
        .from('seller_products')
        .select('seller_id, product_id, price_cents, stock, active')
        .eq('active', true)
        .gt('stock', 0)
        .limit(20);

      if (queryError) {
        console.error('❌ Error cargando productos:', queryError);
        setError('Error cargando productos');
        setLoading(false);
        return;
      }

      console.log('📊 Productos encontrados:', data?.length || 0);

      if (data && data.length > 0) {
        console.log('✅ Productos encontrados, obteniendo datos...');
        
        // Obtener datos de productos y perfiles por separado
        const productIds = data.map(item => item.product_id);
        const sellerIds = [...new Set(data.map(item => item.seller_id))];

        const [productsResult, profilesResult] = await Promise.allSettled([
          supabase.from('products').select('id, title, description, category, image_url').in('id', productIds),
          supabase.from('profiles').select('id, name').in('id', sellerIds)
        ]);

        const productsData = productsResult.status === 'fulfilled' ? productsResult.value.data : [];
        const profilesData = profilesResult.status === 'fulfilled' ? profilesResult.value.data : [];

        // Crear mapas para búsqueda rápida
        const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Transformar productos con datos completos
        const transformedProducts: Product[] = data.map((item, index) => {
          const product = productsMap.get(item.product_id);
          const profile = profilesMap.get(item.seller_id);
          
          return {
            id: `sp-${index}-${Date.now()}`,
            title: product?.title || 'Producto',
            description: product?.description || 'Descripción no disponible',
            category: product?.category || 'general',
            image_url: product?.image_url || 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80',
            price_cents: item.price_cents || 0,
            stock: item.stock || 0,
            seller_id: item.seller_id || '',
            seller_name: profile?.name || 'Vendedor',
            seller_avatar: '/default-avatar.png',
            created_at: new Date().toISOString(),
            is_featured: false,
            sales_count: 0
          };
        });

        setProducts(transformedProducts);
        console.log(`✅ Productos cargados: ${transformedProducts.length}`);
        setLoading(false);
        return;
      }

      // Si no hay productos, mostrar productos de ejemplo
      console.log('⚠️ No hay productos reales, mostrando productos de ejemplo');
      const fallbackProducts: Product[] = [
        {
          id: 'fallback-1',
          title: 'Cachapa con Queso',
          description: 'Deliciosa cachapa con queso fresco',
          category: 'comida',
          image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80',
          price_cents: 350000,
          stock: 10,
          seller_id: 'fallback-seller',
          seller_name: 'Minimarket La Esquina',
          seller_avatar: '/default-avatar.png',
          created_at: new Date().toISOString(),
          is_featured: true,
          sales_count: 15
        },
        {
          id: 'fallback-2',
          title: 'Asador de Pollo',
          description: 'Pollo asado con especias',
          category: 'comida',
          image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80',
          price_cents: 800000,
          stock: 5,
          seller_id: 'fallback-seller',
          seller_name: 'Restaurante El Buen Sabor',
          seller_avatar: '/default-avatar.png',
          created_at: new Date().toISOString(),
          is_featured: false,
          sales_count: 8
        }
      ];
      
      setProducts(fallbackProducts);
      console.log(`✅ Productos de fallback cargados: ${fallbackProducts.length}`);
      setLoading(false);

    } catch (err) {
      console.error('❌ Error cargando productos:', err);
      setError('Error cargando productos');
      
      // Mostrar productos de ejemplo en caso de error
      const fallbackProducts: Product[] = [
        {
          id: 'error-fallback',
          title: 'Producto de Ejemplo',
          description: 'Descripción de ejemplo',
          category: 'general',
          image_url: 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80',
          price_cents: 100000,
          stock: 1,
          seller_id: 'error-seller',
          seller_name: 'Vendedor',
          seller_avatar: '/default-avatar.png',
          created_at: new Date().toISOString(),
          is_featured: false,
          sales_count: 0
        }
      ];
      
      setProducts(fallbackProducts);
      console.log('✅ Productos de fallback mostrados por error');
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

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'comida': '🍽️',
      'belleza': '💄',
      'tecnologia': '📱',
      'servicios': '🔧',
      'otros': '📦'
    };
    return icons[category] || '📦';
  };

  if (loading) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay productos activos disponibles</h3>
        <p className="text-gray-600">Los productos aparecen aquí cuando los vendedores los activan en sus tiendas</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('featured')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'featured' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Destacados
        </button>
        <button
          onClick={() => setFilter('cheapest')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'cheapest' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Más Baratos
        </button>
        <button
          onClick={() => setFilter('popular')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'popular' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Más Vendidos
        </button>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md hover:border-gray-600 transition-all">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getCategoryIcon(product.category)}</span>
                <span className="text-sm text-gray-500 capitalize">{product.category}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-blue-600">{formatPrice(product.price_cents)}</span>
                <span className="text-sm text-gray-500">Stock: {product.stock}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {product.seller_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{product.seller_name}</span>
              </div>
              <button 
                onClick={async () => {
                  if (product.category === 'servicios') {
                    console.log('Contactar servicio:', product.id);
                  } else {
                    // Agregar al carrito real
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
                  }
                }}
                disabled={cartLoading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cartLoading ? 'Agregando...' : (product.category === 'servicios' ? 'Contactar' : 'Añadir al carrito')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
