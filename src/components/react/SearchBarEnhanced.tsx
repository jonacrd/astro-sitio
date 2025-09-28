import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';

interface SearchResult {
  id: string;
  productId: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  price: number;
  stock: number;
  sellerId: string;
  sellerName: string;
  sellerOnline: boolean;
  isActive: boolean;
  productUrl: string;
  addToCartUrl: string;
  sellerUrl: string;
}

interface SearchBarEnhancedProps {
  onSubmit?: (query: string) => void;
  onAddToCart?: (productId: string, sellerId: string) => void;
  onViewProduct?: (productId: string) => void;
  onViewSeller?: (sellerId: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBarEnhanced({ 
  onSubmit, 
  onAddToCart,
  onViewProduct,
  onViewSeller,
  placeholder = "¿Qué necesitas? Ej: cerveza, hamburguesa, corte de cabello...",
  className = ""
}: SearchBarEnhancedProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<Record<string, { seller: any; products: any[] }>>({});
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { addToCart, loading: cartLoading } = useCart();

  // Sugerencias de búsqueda
  const suggestions = [
    'Cerveza',
    'Hamburguesa',
    'Pizza',
    'Corte de cabello',
    'Impresiones',
    'Café',
    'Pan',
    'Servicios'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await performSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const performSearch = async (searchQuery: string) => {
    try {
      setIsSearching(true);
      setError(null);
      setShowResults(true);
      setLastQuery(searchQuery);

      console.log('🔍 Buscando:', searchQuery);

      // Intentar búsqueda inteligente primero
      let response = await fetch(`/api/nl-search-real?q=${encodeURIComponent(searchQuery)}`);
      let data = await response.json();

      // Si la búsqueda inteligente falla, usar búsqueda básica
      if (!data.success || !data.items || data.items.length === 0) {
        console.log('🔄 Búsqueda inteligente falló, usando búsqueda básica...');
        response = await fetch(`/api/search/active?q=${encodeURIComponent(searchQuery)}`);
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }
      
      if (data.success) {
        // Adaptar resultados de búsqueda inteligente
        if (data.items) {
          const adaptedResults = data.items.map((item: any) => ({
            id: `${item.sellerId}-${item.productId}`,
            productId: item.productId,
            title: item.productTitle,
            description: item.description,
            category: item.category,
            image_url: item.imageUrl,
            price: Math.round(item.priceCents / 100),
            price_cents: item.priceCents,
            stock: item.stock,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            sellerOnline: item.online || false,
            isActive: true,
            productUrl: `/producto/${item.productId}`,
            addToCartUrl: `/api/cart/add?productId=${item.productId}&sellerId=${item.sellerId}`,
            sellerUrl: `/vendedor/${item.sellerId}`
          }));

          setResults(adaptedResults);
          
          // Agrupar por vendedor
          const grouped = adaptedResults.reduce((acc: any, product: any) => {
            const sellerId = product.sellerId;
            if (!acc[sellerId]) {
              acc[sellerId] = {
                seller: {
                  id: product.sellerId,
                  name: product.sellerName,
                  online: product.sellerOnline
                },
                products: []
              };
            }
            acc[sellerId].products.push(product);
            return acc;
          }, {});

          setGroupedResults(grouped);
          console.log(`✅ Búsqueda inteligente exitosa: ${adaptedResults.length} productos`);
        } else {
          // Usar resultados de búsqueda básica
          setResults(data.data.results || []);
          setGroupedResults(data.data.groupedResults || {});
          console.log(`✅ Búsqueda básica exitosa: ${data.data.total} productos de ${data.data.sellersCount} vendedores`);
        }
      } else {
        throw new Error(data.error || 'Error en la búsqueda');
      }

      // Llamar al callback del padre si existe
      if (onSubmit) {
        onSubmit(searchQuery);
      }

    } catch (err) {
      console.error('❌ Error en búsqueda:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setResults([]);
      setGroupedResults({});
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const handleAddToCart = async (productId: string, sellerId: string, title: string, price_cents: number, image_url?: string) => {
    console.log('🛒 Añadir al carrito:', productId, sellerId);
    
    // Agregar al carrito real
    const success = await addToCart(productId, sellerId, title, price_cents, 1, image_url);
    
    if (success) {
      console.log('✅ Producto agregado al carrito:', title);
    } else {
      console.error('❌ Error agregando al carrito:', title);
    }
    
    // Callback opcional
    if (onAddToCart) {
      onAddToCart(productId, sellerId);
    }
  };

  const handleViewProduct = (productId: string) => {
    console.log('👁️ Ver producto:', productId);
    if (onViewProduct) {
      onViewProduct(productId);
    }
  };

  const handleViewSeller = (sellerId: string) => {
    console.log('🏪 Ver vendedor:', sellerId);
    if (onViewSeller) {
      onViewSeller(sellerId);
    }
  };

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {/* Barra de búsqueda */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2 items-stretch w-full">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-500 ring-2 ring-white/25 focus:ring-blue-500 focus:outline-none transition-all duration-200"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="btn-primary-opaque rounded-xl px-5 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Buscando...</span>
              </div>
            ) : (
              'Buscar'
            )}
          </button>
        </div>
      </form>

      {/* Sugerencias */}
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {suggestions.map(suggestion => (
          <button
            key={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
            className="tag-opaque shrink-0 text-sm px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors duration-200"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 text-red-100 bg-red-600/70 border border-red-400 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-red-200">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Resultados */}
      {showResults && (
        <div ref={resultsRef} className="mt-4 bg-gray-900 rounded-xl shadow-lg border border-gray-700 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-lg font-medium text-white">No se encontraron productos</p>
              <p className="text-sm text-gray-400">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Header con icono de robot */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🤖</span>
                </div>
                <h3 className="text-sm text-gray-300">Resultado de búsqueda</h3>
              </div>

              {/* Query principal */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-white mb-4">
                  {lastQuery} con delivery gratis ahora:
                </h4>
              </div>

              {/* Resultados agrupados por vendedor */}
              {Object.entries(groupedResults).map(([sellerId, group]) => (
                <div key={sellerId} className="mb-6 last:mb-0">
                  {/* Productos del vendedor */}
                  <div className="space-y-4">
                    {group.products.map(product => (
                      <div key={product.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="flex gap-4">
                          {/* Imagen del producto */}
                          <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.image_url || '/default-product.png'}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-product.png';
                              }}
                            />
                          </div>

                          {/* Información del producto */}
                          <div className="flex-1 min-w-0">
                            {/* Badge de disponibilidad */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                DISPONIBLE AHORA
                              </span>
                              {group.seller.online && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                  ONLINE
                                </span>
                              )}
                            </div>

                            <h5 className="font-bold text-white text-lg mb-1">{product.title}</h5>
                            <p className="text-gray-300 text-sm mb-2">{group.seller.name}</p>
                            <p className="text-gray-400 text-sm mb-2">Envío gratis</p>
                            <p className="text-2xl font-bold text-white">${product.price.toLocaleString('es-CL')}</p>
                          </div>
                        </div>

                        {/* Botón de acción principal */}
                        <button
                          onClick={() => handleAddToCart(product.productId, product.sellerId, product.title, product.price_cents, product.image_url)}
                          disabled={cartLoading}
                          className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cartLoading ? 'AGREGANDO...' : 'PEDIR AHORA'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Productos relacionados */}
              {results.length > 1 && (
                <div className="mt-6">
                  <h4 className="text-white font-semibold mb-4">Productos relacionados</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {results.slice(1, 3).map(product => (
                      <div key={product.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <div className="w-full h-20 bg-gray-700 rounded-lg overflow-hidden mb-2">
                          <img
                            src={product.image_url || '/default-product.png'}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/default-product.png';
                            }}
                          />
                        </div>
                        <p className="text-white text-sm font-medium">{product.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
