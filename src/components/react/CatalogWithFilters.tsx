// src/components/react/CatalogWithFilters.tsx
import { useState, useEffect } from 'react';
// Funciones de utilidad para formateo
const getOriginBadge = (origin: string): string => {
  switch (origin.toLowerCase()) {
    case 'chi': return '🇨🇱';
    case 'ven': return '🇻🇪';
    default: return '';
  }
};

const getOriginBadgeColor = (origin: string): string => {
  switch (origin.toLowerCase()) {
    case 'chi': return 'bg-blue-100 text-blue-800';
    case 'ven': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatPriceWithDiscount = (priceCents: number, discountCents?: number): { original: string; discounted: string; hasDiscount: boolean } => {
  const hasDiscount = discountCents && discountCents > 0;
  const discountedPrice = hasDiscount ? priceCents - discountCents : priceCents;
  
  return {
    original: formatPrice(priceCents),
    discounted: formatPrice(discountedPrice),
    hasDiscount: !!hasDiscount
  };
};

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  priceCents: number;
  discount?: number;
  discountCents?: number;
  stock: number;
  imageUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  origin: string;
  rating: number;
  active: boolean;
  sellerOnline: boolean;
  deliveryETA?: string;
  effectivePrice: number;
}

interface CatalogWithFiltersProps {
  initialCategory?: string;
}

export default function CatalogWithFilters({ initialCategory }: CatalogWithFiltersProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: initialCategory || '',
    origin: '',
    online: '',
    q: '',
    limit: 50,
  });

  // Cargar productos
  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.origin) params.append('origin', filters.origin);
      if (filters.online) params.append('online', filters.online);
      if (filters.q) params.append('q', filters.q);
      params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/products/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setError(data.error || 'Error al cargar productos');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      origin: '',
      online: '',
      q: '',
      limit: 50,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
              placeholder="Nombre del producto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="comida">Comida</option>
              <option value="ropa">Ropa</option>
              <option value="tecnologia">Tecnología</option>
              <option value="hogar">Hogar</option>
              <option value="deportes">Deportes</option>
              <option value="servicios">Servicios</option>
            </select>
          </div>

          {/* Origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origen
            </label>
            <select
              value={filters.origin}
              onChange={(e) => handleFilterChange('origin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="chi">🇨🇱 Chilenos</option>
              <option value="ven">🇻🇪 Venezolanos</option>
            </select>
          </div>

          {/* Vendedor Online */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disponibilidad
            </label>
            <select
              value={filters.online}
              onChange={(e) => handleFilterChange('online', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="mb-4">
        <p className="text-gray-600">
          {loading ? 'Cargando...' : `${products.length} productos encontrados`}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Grid de productos */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const priceInfo = formatPriceWithDiscount(product.priceCents, product.discountCents);
            
            return (
              <div key={product.id} className="group">
                {/* Imagen con bordes redondeados */}
                <div className="relative rounded-2xl overflow-hidden mb-3">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `/img/placeholders/${product.category.slug}.jpg`;
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center bg-gray-800 rounded-2xl">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  
                  {/* Badge de origen arriba-izquierda */}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex h-6 px-2 rounded-full text-white text-[11px] font-semibold items-center ${getOriginBadgeColor(product.origin)}`}>
                      {getOriginBadge(product.origin)}
                    </span>
                  </div>

                  {/* Badge de vendedor online arriba-derecha */}
                  {product.sellerOnline && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex h-6 px-2 rounded-full bg-green-600/90 text-white text-[11px] font-semibold">
                        ✅ Activo
                      </span>
                    </div>
                  )}

                  {/* Badge de descuento si aplica */}
                  {priceInfo.hasDiscount && (
                    <div className="absolute top-10 right-2">
                      <span className="inline-flex h-6 px-2 rounded-full bg-red-600/90 text-white text-[11px] font-semibold">
                        -{Math.round((product.discountCents! / product.priceCents) * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Overlay inferior con gradiente */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
                    <h3 className="text-white text-[15px] font-semibold line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/70 text-[11px]">⭐ {product.rating.toFixed(1)}</span>
                      <span className="text-white/70 text-[11px]">📦 {product.stock}</span>
                    </div>
                  </div>
                </div>

                {/* Contenido inferior sin background */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-white text-[18px] font-extrabold">
                      {priceInfo.discounted}
                    </p>
                    {priceInfo.hasDiscount && (
                      <p className="text-white/50 text-[12px] line-through">
                        {priceInfo.original}
                      </p>
                    )}
                  </div>
                  
                  {/* Botón + a la derecha del precio */}
                  <button
                    onClick={(e) => {
                      const button = e.currentTarget;
                      button.classList.add('animate-bounce');
                      setTimeout(() => button.classList.remove('animate-bounce'), 500);
                      
                      console.log('Ver detalles:', product.id);
                    }}
                    className="h-8 w-8 rounded-full bg-towny text-white grid place-items-center hover:bg-towny-light hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                    aria-label="Ver detalles"
                  >
                    <span className="text-xl font-bold leading-none">+</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-600 mb-4">
            Intenta ajustar los filtros o busca con otros términos
          </p>
          <button
            onClick={clearFilters}
            className="bg-towny text-white px-6 py-2 rounded-md hover:bg-towny-dark transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
