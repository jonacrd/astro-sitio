import React, { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid';

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

interface CategoryRecommendationsProps {
  title?: string;
  limit?: number;
  categories?: string[];
}

export default function CategoryRecommendations({ 
  title = "Productos por Categoría", 
  limit = 8,
  categories = ['comida', 'tecnologia', 'hogar', 'belleza']
}: CategoryRecommendationsProps) {
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryProducts = async (category: string) => {
    try {
      const response = await fetch(`/api/feed/real?category=${encodeURIComponent(category)}&limit=${Math.ceil(limit / categories.length)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setProductsByCategory(prev => ({
          ...prev,
          [category]: data.data.products
        }));
      } else {
        console.error(`Error fetching products for category ${category}:`, data.error);
      }
    } catch (err: any) {
      console.error(`Error fetching products for category ${category}:`, err);
    }
  };

  const fetchAllCategories = async () => {
    setLoading(true);
    setError(null);
    
    const fetchPromises = categories.map(category => fetchCategoryProducts(category));
    await Promise.all(fetchPromises);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAllCategories();
  }, [categories, limit]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando productos por categoría...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error al cargar productos: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {categories.map((category) => {
        const products = productsByCategory[category] || [];
        if (products.length === 0) return null;

        return (
          <div key={category} className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize">
              {category}
            </h3>
            <ProductGrid 
              products={products} 
              variant="small"
              showSeller={true}
            />
          </div>
        );
      })}
    </div>
  );
}









