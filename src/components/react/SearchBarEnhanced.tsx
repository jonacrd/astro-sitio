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

interface SearchBarEnhancedProps {
  onSearch?: (query: string) => void;
  onCategoryClick?: (category: string) => void;
  onSellerClick?: (sellerId: string) => void;
  placeholder?: string;
}

export default function SearchBarEnhanced({
  onSearch,
  onCategoryClick,
  onSellerClick,
  placeholder = "¿Qué necesitas?"
}: SearchBarEnhancedProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowResults(true);

    try {
      console.log('🔍 Buscando en base de datos:', searchQuery);
      
      // Usar el endpoint de búsqueda que ya existe
      const response = await fetch(`/api/search/simple?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      console.log('📊 Respuesta de búsqueda:', data);

      if (data.success && data.data && data.data.results) {
        const products = data.data.results.map((item: any) => ({
          id: item.id,
          title: item.title,
          price_cents: item.price,
          image_url: item.image || '/img/placeholders/tecnologia.jpg',
          seller_name: item.sellerName || 'Vendedor',
          seller_id: item.sellerId,
          stock: item.stock || 0,
          category: item.category || 'General'
        }));

        setResults(products);
        console.log('✅ Resultados de búsqueda:', products.length);
      } else {
        setResults([]);
        console.log('⚠️ No se encontraron resultados');
        console.log('📊 Estructura de datos recibida:', {
          success: data.success,
          hasData: !!data.data,
          hasResults: !!(data.data && data.data.results),
          resultsLength: data.data?.results?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      setResults([]);
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

      {/* Resultados de búsqueda */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Buscando en base de datos...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((product) => (
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
                    <p className="text-gray-500 text-xs">{product.seller_name}</p>
                    <p className="text-blue-600 font-semibold text-sm">
                      $${(product.price_cents / 100).toLocaleString()}
                    </p>
                    <p className="text-green-600 text-xs">Stock: {product.stock}</p>
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
          ) : (
            <div className="p-4 text-center">
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}
        </div>
      )}

      {/* Categorías rápidas */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['Electrónicos', 'Ropa', 'Hogar', 'Deportes', 'Libros'].map((category) => (
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