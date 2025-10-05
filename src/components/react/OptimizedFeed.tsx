import React, { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '../../lib/money';
import CartToast from './CartToast';
import QuestionsSystem from './QuestionsSystem';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  price_cents: number;
  seller_id: string;
  seller_name: string;
  seller_active: boolean;
  stock: number;
  inventory_mode: string;
  available_today: boolean;
  sold_out: boolean;
}

interface OptimizedFeedProps {
  className?: string;
}

const CATEGORIES = [
  { id: 'todos', name: 'Todos', icon: '📦' },
  { id: 'supermercado', name: 'Abarrotes', icon: '🛒' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
  { id: 'bebidas_alcoholicas', name: 'Bebidas Alcohólicas', icon: '🍺' },
  { id: 'cereales', name: 'Cereales', icon: '🌾' },
  { id: 'comida_rapida', name: 'Comida Rápida', icon: '🍔' },
  { id: 'lacteos', name: 'Lácteos', icon: '🥛' },
  { id: 'panaderia', name: 'Panadería', icon: '🥖' },
  { id: 'carnes', name: 'Carnes', icon: '🥩' },
  { id: 'frutas_verduras', name: 'Frutas y Verduras', icon: '🥬' },
  { id: 'limpieza', name: 'Limpieza', icon: '🧽' },
  { id: 'higiene', name: 'Higiene Personal', icon: '🧴' },
  { id: 'servicios', name: 'Servicios', icon: '🛠️' },
  { id: 'otros', name: 'Otros', icon: '📦' }
];

export default function OptimizedFeed({ className = '' }: OptimizedFeedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<{ productName: string; productImage: string } | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  const loadProducts = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/feed/products?page=${page}&limit=20`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error cargando productos');
      }

      const newProducts = data.data.products;
      
      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }

      setHasMore(data.data.pagination.hasMore);
      setCurrentPage(page);

      console.log(`✅ Página ${page} cargada: ${newProducts.length} productos`);
    } catch (err: any) {
      console.error('❌ Error cargando productos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadProducts(currentPage + 1, true);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!product.seller_active) {
      const confirmAdd = window.confirm(
        `⚠️ ${product.seller_name} está cerrado ahora.\n\n¿Quieres agregar este producto al carrito de todas formas?`
      );
      if (!confirmAdd) return;
    }

    try {
      const cartItem = {
        id: product.id,
        title: product.title,
        price: product.price_cents,
        image: product.image_url || '/images/placeholder.jpg',
        seller_id: product.seller_id,
        seller_name: product.seller_name,
        quantity: 1
      };

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex((item: any) => 
        item.id === cartItem.id && item.seller_id === cartItem.seller_id
      );

      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].quantity += 1;
      } else {
        existingCart.push(cartItem);
      }

      localStorage.setItem('cart', JSON.stringify(existingCart));

      // Mostrar toast
      setToastData({
        productName: product.title,
        productImage: product.image_url || '/images/placeholder.jpg'
      });
      setShowToast(true);

      // Dispatch event para actualizar contador del carrito
      window.dispatchEvent(new CustomEvent('cart-updated'));

      console.log('✅ Producto agregado al carrito:', product.title);
    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
    }
  };

  const getProductsByCategory = (category: string) => {
    return products.filter(product => product.category === category);
  };

  const getGroupedProducts = () => {
    if (selectedCategory) {
      return { [selectedCategory]: getProductsByCategory(selectedCategory) };
    }
    
    const grouped: Record<string, Product[]> = {};
    products.forEach(product => {
      const category = product.category || 'otros';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton para categorías */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-shrink-0 w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        {/* Skeleton para productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error: {error}</p>
        <button 
          onClick={() => loadProducts(1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const groupedProducts = getGroupedProducts();

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Botón de Preguntas del Vecindario */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowQuestions(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <span>🏘️</span>
          Haz una Pregunta a la Comunidad
        </button>
      </div>

      {/* Categorías */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(category => {
          const productCount = category.id === 'todos' 
            ? products.length 
            : getProductsByCategory(category.id).length;
          
          if (productCount === 0) return null;

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id === 'todos' ? null : category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                (selectedCategory === null && category.id === 'todos') || 
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.icon} {category.name} ({productCount})
            </button>
          );
        })}
      </div>

      {/* Productos organizados por categorías */}
      {Object.entries(groupedProducts).map(([categoryId, categoryProducts]) => {
        if (categoryProducts.length === 0) return null;
        
        const categoryInfo = CATEGORIES.find(c => c.id === categoryId) || 
          { id: categoryId, name: categoryId, icon: '📦' };

        return (
          <div key={categoryId} className="space-y-4">
            {/* Título de la categoría */}
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {categoryInfo.icon} {categoryInfo.name}
              </h2>
              <span className="text-sm text-gray-500">
                ({categoryProducts.length} productos)
              </span>
            </div>

            {/* Grid de productos de la categoría */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categoryProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow relative">
                  {/* Badge de vendedor */}
                  <a 
                    href={`/vendedor/${product.seller_id}`}
                    className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer ${
                      product.seller_active ? 'bg-green-600/90 hover:bg-green-500/90' : 'bg-gray-600/90 hover:bg-gray-500/90'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {product.seller_name}
                  </a>

                  {/* Imagen del producto */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={product.image_url || '/images/placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Información del producto */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {product.title}
                    </h3>
                    
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(product.price_cents)}
                    </p>
                    
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.seller_active && !window.confirm}
                      className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {!product.seller_active ? 'Tienda cerrada' : 'Agregar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Botón cargar más */}
      {hasMore && (
        <div className="text-center py-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loadingMore ? 'Cargando...' : 'Cargar más productos'}
          </button>
        </div>
      )}

      {/* Toast de producto agregado */}
      {showToast && toastData && (
        <CartToast
          productName={toastData.productName}
          productImage={toastData.productImage}
          onClose={() => setShowToast(false)}
          onClick={() => {
            window.location.href = '/carrito';
          }}
        />
      )}

      {/* Sistema de Preguntas del Vecindario */}
      <QuestionsSystem
        isOpen={showQuestions}
        onClose={() => setShowQuestions(false)}
      />
    </div>
  );
}
