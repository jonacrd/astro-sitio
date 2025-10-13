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
        price: product.price_cents / 100, // Convertir centavos a pesos
        image: product.image_url || '/images/placeholder.jpg',
        sellerId: product.seller_id,
        sellerName: product.seller_name,
        quantity: 1
      };

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex((item: any) => 
        item.id === cartItem.id && (item.sellerId === cartItem.sellerId || item.seller_id === cartItem.sellerId)
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
            <div key={i}>
              <div className="rounded-2xl overflow-hidden bg-gray-700 animate-pulse mb-3">
                <div className="w-full aspect-square bg-gray-600"></div>
              </div>
              <div className="flex items-center justify-between px-1">
                <div className="h-5 bg-gray-600 rounded w-1/2 animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-600 rounded-full animate-pulse"></div>
              </div>
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
          className="mt-4 px-4 py-2 bg-towny text-white rounded-lg hover:bg-towny-dark"
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
          className="btn-primary-opaque bg-opacity-80 hover:bg-opacity-90 border border-blue-500/30 rounded-xl p-3 transition-all duration-200 hover:scale-[1.02] group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-white font-medium text-sm">Haz una pregunta</h3>
              <p className="text-white/60 text-xs">A la comunidad</p>
            </div>
          </div>
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
                  ? 'bg-towny text-white'
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
                <div key={product.id} className="group">
                  {/* Imagen con bordes redondeados */}
                  <div className="relative rounded-2xl overflow-hidden mb-3">
                    <img
                      src={product.image_url || '/images/placeholder.jpg'}
                      alt={product.title}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                    
                    {/* Badge de vendedor arriba-izquierda */}
                    <div className="absolute top-2 left-2">
                      <a 
                        href={`/vendedor/${product.seller_id}`}
                        className={`inline-flex h-6 px-2 rounded-full text-white text-[11px] font-semibold items-center gap-1 hover:scale-105 transition-all duration-200 cursor-pointer ${
                          product.seller_active 
                            ? 'bg-green-600/90' 
                            : 'bg-gray-600/90'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.seller_active ? 'bg-white' : 'bg-gray-300'}`}></span>
                        {product.seller_name}
                      </a>
                    </div>

                    {/* Overlay inferior con gradiente */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
                      <h3 className="text-white text-[15px] font-semibold line-clamp-2">
                        {product.title}
                      </h3>
                    </div>
                  </div>

                  {/* Contenido inferior sin background */}
                  <div className="flex items-center justify-between px-1">
                    <p className="text-white text-[18px] font-extrabold">
                      {formatPrice(product.price_cents)}
                    </p>
                    
                    {/* Botón + a la derecha del precio */}
                    <button
                      onClick={(e) => {
                        // Animación del botón
                        const button = e.currentTarget;
                        button.classList.add('animate-bounce');
                        setTimeout(() => button.classList.remove('animate-bounce'), 500);
                        
                        handleAddToCart(product);
                      }}
                      disabled={!product.seller_active && !window.confirm}
                      className={`h-8 w-8 rounded-full text-white grid place-items-center transition-all duration-200 shadow-lg hover:shadow-xl ${
                        product.seller_active
                          ? 'bg-towny hover:bg-towny-light hover:scale-110 active:scale-95'
                          : 'bg-gray-600 cursor-not-allowed opacity-50'
                      }`}
                      aria-label="Agregar al carrito"
                    >
                      <span className="text-xl font-bold leading-none">+</span>
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
            className="px-6 py-3 bg-towny text-white rounded-lg hover:bg-towny-dark disabled:bg-gray-400 transition-colors"
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
            // Abrir el modal del carrito haciendo click en el botón del carrito
            console.log('🍞 Toast clicked - buscando botón del carrito...');
            const cartButton = document.getElementById('cart-button');
            if (cartButton) {
              console.log('✅ Botón del carrito encontrado, haciendo click...');
              cartButton.click();
            } else {
              console.log('❌ Botón del carrito no encontrado');
            }
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
