import React, { useState, useEffect, useRef } from 'react';

interface SmartSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const SmartSearchBar: React.FC<SmartSearchBarProps> = ({ 
  onSearch,
  placeholder = "¿Qué necesitas?" 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sugerencias estáticas iniciales
  const staticSuggestions = [
    "perros calientes",
    "empanadas", 
    "arroz",
    "bebidas",
    "comida",
    "medicinas",
    "postres"
  ];

  // Función para obtener sugerencias de la IA
  const fetchAISuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setAiSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/search/ai?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success && data.data.results) {
        // Extraer títulos únicos de los resultados
        const productTitles = data.data.results
          .slice(0, 5) // Limitar a 5 sugerencias
          .map((product: any) => product.title);
        
        setAiSuggestions(data.data.results.slice(0, 5));
        setSuggestions(productTitles);
        setShowSuggestions(true);
      } else {
        // Fallback a sugerencias estáticas
        const filtered = staticSuggestions.filter(item => 
          item.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias de IA:', error);
      // Fallback a sugerencias estáticas
      const filtered = staticSuggestions.filter(item => 
        item.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para las sugerencias
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchAISuggestions(query);
      } else {
        setSuggestions([]);
        setAiSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Esperar 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(suggestion);
    }
    // Redirigir a página de resultados de búsqueda
    window.location.href = `/buscar?q=${encodeURIComponent(suggestion)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(query);
      }
      // Redirigir a página de resultados de búsqueda
      window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    // Mostrar guía contextual la primera vez
    const isFirstTimeSearching = localStorage.getItem('town_first_search');
    if (!isFirstTimeSearching) {
      // Disparar evento personalizado para mostrar la guía
      window.dispatchEvent(new CustomEvent('show-search-guide'));
      localStorage.setItem('town_first_search', 'true');
    }

    // Mostrar sugerencias si hay query
    if (query.length >= 2) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
        <input
            ref={inputRef}
            type="search"
          value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={() => {
              // Delay para permitir clicks en sugerencias
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          placeholder={placeholder}
            className="w-full px-5 py-4 pr-14 text-white bg-white/5 backdrop-blur-md border-2 border-[#FF4D6A]/30 rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-[#FF4D6A]/50 focus:border-[#FF4D6A] focus:bg-white/10 placeholder-white/50 transition-all duration-200"
            id="main-search-input"
            style={{
              boxShadow: '0 8px 32px rgba(255, 77, 106, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
        />
        <button
          type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 bg-[#FF4D6A] text-white hover:bg-[#E6435D] rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
            )}
        </button>
        </div>
      </form>

      {/* Sugerencias con IA - Estilo Rosa Towny */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-3 bg-gray-900/95 backdrop-blur-xl border-2 border-[#FF4D6A]/30 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-5 py-3 text-left text-white hover:bg-[#FF4D6A]/20 hover:text-[#FF4D6A] transition-all duration-200 first:rounded-t-2xl last:rounded-b-2xl flex items-center space-x-3 group"
            >
              <svg className="w-4 h-4 text-white/60 group-hover:text-[#FF4D6A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-medium">{suggestion}</span>
                          </button>
                        ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;
