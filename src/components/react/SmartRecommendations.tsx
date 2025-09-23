import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../lib/cart-store';
import ProductGridDisplay from './ProductGridDisplay';

interface Product {
  id: string;
  productId: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string | null;
  priceCents: number;
  stock: number;
  sellerName: string;
  isOnline: boolean;
  productUrl: string;
}

interface SmartRecommendationsProps {
  title?: string;
  limit?: number;
  showCategoryFilter?: boolean;
}

export default function SmartRecommendations({ 
  title = "Productos Recomendados", 
  limit = 12,
  showCategoryFilter = true
}: SmartRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [lastSellerId, setLastSellerId] = useState<string | null>(null);
  const store = useCartStore();


  const fetchProducts = async (category?: string) => {
    if (!store.activeSellerId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('sellerId', store.activeSellerId);
      
      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/feed/real?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
        
        // Extraer categorías únicas si no están definidas
        if (availableCategories.length === 0) {
          const categories = [...new Set(data.data.products.map((p: Product) => p.category))];
          setAvailableCategories(categories);
        }
      } else {
        setError(data.error || 'Error al cargar productos');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Detectar si cambió el vendedor
    const sellerChanged = lastSellerId !== store.activeSellerId;
    
    if (store.activeSellerId) {
      if (sellerChanged) {
        // Resetear todo cuando cambia el vendedor
        setProducts([]);
        setAvailableCategories([]);
        setSelectedCategory(null);
        setLastSellerId(store.activeSellerId);
      }
      
      setLoading(true);
      fetchProducts(selectedCategory || undefined);
    } else {
      setProducts([]);
      setAvailableCategories([]);
      setSelectedCategory(null);
      setLastSellerId(null);
      setLoading(false);
    }
  }, [store.activeSellerId, store.activeSellerName, limit, selectedCategory]);

  // Escuchar cambios en el store del carrito
  useEffect(() => {
    const handleCartUpdate = (event: any) => {
      fetchProducts(selectedCategory || undefined);
    };

    const handleForceRefresh = (event: any) => {
      // Resetear estado cuando se fuerza la actualización
      setProducts([]);
      setAvailableCategories([]);
      setSelectedCategory(null);
      setLoading(true);
      
      fetchProducts(selectedCategory || undefined);
    };

    const handleSellerChange = (event: any) => {
      // Resetear todo cuando cambia el vendedor
      setProducts([]);
      setAvailableCategories([]);
      setSelectedCategory(null);
      setLastSellerId(event.detail.sellerId);
      setLoading(true);
      
      fetchProducts(undefined);
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('force-feed-refresh', handleForceRefresh);
    window.addEventListener('seller-changed', handleSellerChange);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('force-feed-refresh', handleForceRefresh);
      window.removeEventListener('seller-changed', handleSellerChange);
    };
  }, [selectedCategory, store.activeSellerId]);

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategory) {
      setSelectedCategory(null); // Deseleccionar si ya está seleccionada
    } else {
      setSelectedCategory(category);
    }
  };

  if (!store.activeSellerId) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando recomendaciones de {store.activeSellerName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="text-center py-8 text-red-500">
          <p>Error al cargar productos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <span className="text-sm text-gray-500">
          {products.length} productos disponibles
        </span>
      </div>

      {/* Filtros de categoría */}
      {showCategoryFilter && availableCategories.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas las categorías
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

       <ProductGridDisplay 
         products={products} 
         title="Más productos de esta tienda"
         variant="medium"
         showSeller={true}
       />
    </div>
  );
}
