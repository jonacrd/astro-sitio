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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Imagen */}
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback a placeholder si la imagen falla
                      (e.target as HTMLImageElement).src = `/img/placeholders/${product.category.slug}.jpg`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                
                {/* Badge de origen */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getOriginBadgeColor(product.origin)}`}>
                  {getOriginBadge(product.origin)}
                </div>

                {/* Badge de vendedor online */}
                {product.sellerOnline && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    ✅ Activo
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>

                {/* Precio */}
                <div className="mb-3">
                  {(() => {
                    const priceInfo = formatPriceWithDiscount(product.priceCents, product.discountCents);
                    return priceInfo.hasDiscount ? (
                      <div>
                        <span className="text-lg font-bold text-green-600">
                          {priceInfo.discounted}
                        </span>
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {priceInfo.original}
                        </span>
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          -{Math.round((product.discountCents! / product.priceCents) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {priceInfo.discounted}
                      </span>
                    );
                  })()}
                </div>

                {/* Info adicional */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>⭐ {product.rating.toFixed(1)}</span>
                  <span>📦 {product.stock} disponibles</span>
                </div>

                {/* ETA de entrega */}
                {product.sellerOnline && product.deliveryETA && (
                  <div className="text-xs text-green-600 mb-3">
                    🚚 Entrega: {product.deliveryETA}
                  </div>
                )}

                {/* Botón */}
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
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
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
