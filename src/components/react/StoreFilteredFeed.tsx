import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../lib/cart-store';
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

interface StoreFilteredFeedProps {
  title?: string;
  limit?: number;
}

export default function StoreFilteredFeed({ 
  title = "Productos de la Tienda", 
  limit = 12 
}: StoreFilteredFeedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const store = useCartStore();

  const fetchProducts = async () => {
    if (!store.activeSellerId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/feed/real?limit=${limit}&sellerId=${store.activeSellerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
      } else {
        setError(data.error || 'Error al cargar productos');
      }
    } catch (err: any) {
      console.error("Error fetching store products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [store.activeSellerId, limit]);

  if (!store.activeSellerId) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos de {store.activeSellerName}...</p>
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
      <ProductGrid products={products} />
    </div>
  );
}




