import React, { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid';

interface Category {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  imageUrl?: string;
}

interface CategoryCatalogProps {
  showAllCategories?: boolean;
  categoriesPerRow?: number;
  productsPerCategory?: number;
}

export default function CategoryCatalog({
  showAllCategories = true,
  categoriesPerRow = 3,
  productsPerCategory = 8
}: CategoryCatalogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Error al cargar categorías');
      }

      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories || []);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGridClasses = () => {
    switch (categoriesPerRow) {
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 4:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
      case 6:
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Catálogo de Productos
        </h2>
        <div className={getGridClasses()}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-32 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Catálogo de Productos
        </h2>
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Error al cargar categorías</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadCategories}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Catálogo de Productos
        </h2>
        <div className="text-center py-8">
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md max-w-md mx-auto">
            <h3 className="font-semibold mb-2">No hay categorías disponibles</h3>
            <p className="text-sm">No se encontraron categorías de productos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Catálogo de Productos
      </h2>

      {/* Lista de categorías */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
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
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.productCount})
            </button>
          ))}
        </div>
      </div>

      {/* Grid de categorías */}
      {!selectedCategory && (
        <div className={getGridClasses()}>
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="h-32 bg-gray-200 relative">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                    {category.productCount} productos
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Productos de la categoría seleccionada */}
      {selectedCategory && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Volver a categorías
            </button>
          </div>
          <ProductGrid
            category={selectedCategory}
            limit={productsPerCategory}
            variant="medium"
            showSeller={true}
            showTitle={false}
          />
        </div>
      )}
    </div>
  );
}





