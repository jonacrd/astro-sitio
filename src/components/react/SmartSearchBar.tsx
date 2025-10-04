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
  relevanceScore: number;
}

interface Seller {
  id: string;
  name: string;
  isActive: boolean;
  productCount: number;
}

interface SmartSearchBarProps {
  onSearch?: (query: string) => void;
  onCategoryClick?: (category: string) => void;
  onSellerClick?: (sellerId: string) => void;
  placeholder?: string;
}

interface SearchResult {
  results: Product[];
  sellers: Seller[];
  relatedCategories: string[];
  correctedQuery: string;
  searchIntent: string;
  total: number;
  message: string;
}

export default function SmartSearchBar({
  onSearch,
  onCategoryClick,
  onSellerClick,
  placeholder = "¿Qué necesitas? Ej: cerveza, hamburguesa, corte de cabello..."
}: SmartSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [relatedCategories, setRelatedCategories] = useState<string[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState('');
  const [localCorrection, setLocalCorrection] = useState('');
  const [searchIntent, setSearchIntent] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'products' | 'sellers' | 'all'>('all');

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSellers([]);
      setRelatedCategories([]);
      setCorrectedQuery('');
      setSearchIntent('');
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      console.log('🤖 Búsqueda con IA:', searchQuery);
      
      // Usar el nuevo endpoint con IA
      const response = await fetch(`/api/search/ai?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      console.log('📊 Respuesta de búsqueda con IA:', data);

      if (data.success && data.data) {
        const searchData: SearchResult = data.data;
        
        const products = searchData.results?.map((item: any) => ({
          id: item.id,
          title: item.title,
          price_cents: item.price,
          image_url: item.image,
          seller_name: item.sellerName,
          seller_id: item.sellerId,
          stock: item.stock,
          category: item.category,
          relevanceScore: item.relevanceScore
        })) || [];

        const sellersData = searchData.sellers?.map((seller: any) => ({
          id: seller.id,
          name: seller.name,
          isActive: seller.isActive,
          productCount: seller.productCount
        })) || [];

        setResults(products);
        setSellers(sellersData);
        setRelatedCategories(searchData.relatedCategories || []);
        setCorrectedQuery(searchData.correctedQuery || searchQuery);
        setLocalCorrection(searchData.localCorrection || '');
        setSearchIntent(searchData.searchIntent || 'product');
        
        console.log(`✅ Resultados con IA: ${products.length} productos, ${sellersData.length} vendedores`);
        console.log(`🔍 Query corregida: "${searchData.correctedQuery}"`);
        console.log(`📂 Categorías relacionadas: ${searchData.relatedCategories?.join(', ')}`);
      } else {
        setResults([]);
        setSellers([]);
        setRelatedCategories([]);
        setCorrectedQuery('');
        setSearchIntent('');
        console.log('⚠️ No se encontraron resultados');
      }
    } catch (error) {
      console.error('❌ Error en búsqueda con IA:', error);
      setResults([]);
      setSellers([]);
      setRelatedCategories([]);
      setCorrectedQuery('');
      setSearchIntent('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
    onSearch?.(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
      onSearch?.(query);
    }
  };

  const getAvailabilityBadge = (product: Product) => {
    if (product.stock > 0) {
      return <span className="text-green-600 text-xs">Stock: {product.stock}</span>;
    }
    return <span className="text-gray-500 text-xs">Sin stock</span>;
  };

  return (
    <div className="relative">
      {/* Barra de búsqueda */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {/* Filtros de búsqueda */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setSearchMode('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            searchMode === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todo ({results.length + sellers.length})
        </button>
        <button
          onClick={() => setSearchMode('products')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            searchMode === 'products' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Productos ({results.length})
        </button>
        <button
          onClick={() => setSearchMode('sellers')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            searchMode === 'sellers' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vendedores ({sellers.length})
        </button>
      </div>

      {/* Resultados de búsqueda */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">🤖 Procesando con IA...</p>
            </div>
          ) : (
            <div className="p-2">
                     {/* Información de búsqueda con IA */}
                     {localCorrection && localCorrection !== query && (
                       <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                         <p className="text-sm text-green-700">
                           <span className="font-semibold">🔤 Corrección automática:</span> "{query}" → "{localCorrection}"
                         </p>
                       </div>
                     )}
                     
                     {correctedQuery && correctedQuery !== localCorrection && correctedQuery !== query && (
                       <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                         <p className="text-sm text-blue-700">
                           <span className="font-semibold">🤖 IA mejoró:</span> "{localCorrection}" → "{correctedQuery}"
                         </p>
                       </div>
                     )}

              {/* Categorías relacionadas */}
              {relatedCategories.length > 0 && (
                <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-semibold mb-1">📂 Categorías relacionadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {relatedCategories.map((category, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(category);
                          handleSearch(category);
                          onCategoryClick?.(category);
                        }}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos */}
              {(searchMode === 'all' || searchMode === 'products') && results.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">
                    📦 Productos ({results.length})
                  </h3>
                  {results.slice(0, 10).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{product.title}</h3>
                        <p className="text-gray-500 text-xs">{product.seller_name} • {product.category}</p>
                        <p className="text-blue-600 font-semibold text-sm">
                          $${(product.price_cents / 100).toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {getAvailabilityBadge(product)}
                        </div>
                      </div>
                      <AddToCartButton
                        productId={product.id}
                        title={product.title}
                        price={product.price_cents / 100}
                        image={product.image_url}
                        sellerName={product.seller_name}
                        sellerId={product.seller_id}
                        className="bg-blue-500 text-white py-1 px-3 rounded-lg hover:bg-blue-600 transition-colors text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Vendedores */}
              {(searchMode === 'all' || searchMode === 'sellers') && sellers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">
                    🏪 Vendedores ({sellers.length})
                  </h3>
                  {sellers.slice(0, 5).map((seller) => (
                    <div key={seller.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-bold text-lg">🏪</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{seller.name}</h3>
                        <p className="text-gray-500 text-xs">
                          {seller.productCount} productos disponibles
                        </p>
                        <span className="text-green-600 text-xs">🟢 Activo</span>
                      </div>
                      <button
                        onClick={() => {
                          window.location.href = `/vendedor/${seller.id}`;
                          onSellerClick?.(seller.id);
                        }}
                        className="bg-green-500 text-white py-1 px-3 rounded-lg hover:bg-green-600 transition-colors text-xs"
                      >
                        Ver tienda
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sin resultados */}
              {results.length === 0 && sellers.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-gray-500">No se encontraron resultados específicos para "{query}"</p>
                  {relatedCategories.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm mb-2">
                        Pero puedes explorar estas categorías relacionadas:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {relatedCategories.map((category, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setQuery(category);
                              handleSearch(category);
                              onCategoryClick?.(category);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm mt-1">
                      Prueba con otras palabras o busca por categoría
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Categorías rápidas */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['Comida Rápida', 'Bebidas', 'Servicios', 'Abastos', 'Cereales'].map((category) => (
          <button
            key={category}
            onClick={() => {
              setQuery(category);
              handleSearch(category);
              onCategoryClick?.(category);
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
