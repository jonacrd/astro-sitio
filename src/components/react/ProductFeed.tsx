import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

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

interface ProductFeedProps {
  className?: string;
}

export default function ProductFeed({ className = '' }: ProductFeedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'featured' | 'cheapest' | 'popular'>('all');

  useEffect(() => {
    loadProducts();
  }, [filter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🛍️ Cargando productos reales...');

      // Consulta simplificada sin joins problemáticos
      const { data, error: queryError } = await supabase
        .from('seller_products')
        .select(`
          price_cents,
          stock,
          active,
          product_id,
          seller_id
        `)
        .eq('active', true)
        .gt('stock', 0)
        .order('price_cents', { ascending: false })
        .limit(20);

      if (queryError) {
        console.error('❌ Error cargando productos:', queryError);
        setError('Error cargando productos');
        return;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No hay productos disponibles');
        setProducts([]);
        return;
      }

      // Obtener detalles de productos por separado
      const productIds = data.map(item => item.product_id);
      const sellerIds = data.map(item => item.seller_id);

      const [productsResult, profilesResult] = await Promise.allSettled([
        supabase.from('products').select('id, title, description, category, image_url').in('id', productIds),
        supabase.from('profiles').select('id, name').in('id', sellerIds)
      ]);

      const productsData = productsResult.status === 'fulfilled' ? productsResult.value.data : [];
      const profilesData = profilesResult.status === 'fulfilled' ? profilesResult.value.data : [];

      // Crear mapas para búsqueda rápida
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Transformar datos
      const transformedProducts: Product[] = data.map((item, index) => {
        const product = productsMap.get(item.product_id);
        const profile = profilesMap.get(item.seller_id);
        
        return {
          id: `sp-${index}-${Date.now()}`,
          title: product?.title || 'Producto',
          description: product?.description || '',
          category: product?.category || 'otros',
          image_url: product?.image_url || '/default-product.png',
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

    } catch (err) {
      console.error('❌ Error cargando productos:', err);
      setError('Error cargando productos');
    } finally {
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
      'tecnologia': '💻',
      'hogar': '🏠',
      'deportes': '⚽',
      'moda': '👕',
      'salud': '💊',
      'comida': '🍕',
      'minimarket': '🛒',
      'postres': '🍰',
      'servicios': '🔧',
      'otros': '📦'
    };
    return icons[category.toLowerCase()] || '📦';
  };

  const getFilterLabel = (filterType: string) => {
    const labels: Record<string, string> = {
      'all': 'Todos',
      'featured': 'Destacados',
      'cheapest': 'Más Baratos',
      'popular': 'Más Vendidos'
    };
    return labels[filterType] || 'Todos';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 text-red-500 ${className}`}>
        <p>Error: {error}</p>
        <button 
          onClick={loadProducts}
          className="mt-4 px-4 py-2 bg-towny-light text-white rounded-lg hover:bg-towny transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Productos Disponibles</h2>
        <div className="flex gap-2">
          {(['all', 'featured', 'cheapest', 'popular'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === filterType
                  ? 'bg-towny text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getFilterLabel(filterType)}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p>No hay productos disponibles</p>
          <p className="text-sm text-gray-400 mt-1">Los productos aparecen aquí cuando los vendedores los agregan</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <div key={product.id} className="group">
              {/* Imagen con bordes redondeados */}
              <div className="relative rounded-2xl overflow-hidden mb-3">
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-product.png';
                  }}
                  loading="lazy"
                />
                
                {/* Badge de categoría arriba-izquierda */}
                <div className="absolute top-2 left-2">
                  <span className="inline-flex h-6 px-2 rounded-full bg-rose-600/90 text-white text-[11px] font-semibold items-center gap-1">
                    {getCategoryIcon(product.category)} {product.category}
                  </span>
                </div>

                {/* Badge de stock arriba-derecha */}
                {product.stock > 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex h-6 px-2 rounded-full bg-green-600/90 text-white text-[11px] font-semibold">
                      {product.stock} disponibles
                    </span>
                  </div>
                )}

                {/* Overlay inferior con gradiente */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
                  <h3 className="text-white text-[15px] font-semibold line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-white/70 text-[12px]">{product.seller_name}</p>
                </div>
              </div>

              {/* Contenido inferior sin background */}
              <div className="flex items-center justify-between px-1">
                <p className="text-white text-[18px] font-extrabold">
                  {formatPrice(product.price_cents)}
                </p>
                
                {/* Botón + a la derecha del precio */}
                <button
                  onClick={(e) => {
                    // Animación del botón
                    const button = e.currentTarget;
                    button.classList.add('animate-bounce');
                    setTimeout(() => button.classList.remove('animate-bounce'), 500);
                    
                    // TODO: Implementar agregar al carrito
                    console.log('Agregar al carrito:', product.id);
                  }}
                  className="h-8 w-8 rounded-full bg-towny text-white grid place-items-center hover:bg-towny-light hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                  aria-label="Agregar al carrito"
                >
                  <span className="text-xl font-bold leading-none">+</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}