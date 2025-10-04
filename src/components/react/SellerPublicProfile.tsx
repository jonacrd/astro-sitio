import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUserAvatar } from '../../lib/avatar-utils';

interface SellerPublicProfileProps {
  sellerId: string;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  address: string;
  is_active: boolean;
  avatar_url: string;
  gender: string;
  created_at: string;
  // Campos adicionales para el perfil público
  business_hours: string;
  delivery_zone: string;
  minimum_order: number;
  delivery_fee: number;
}

interface Product {
  id: string;
  product_id: string;
  seller_id: string;
  price_cents: number;
  stock: number;
  active: boolean;
  inventory_mode: string;
  available_today: boolean;
  sold_out: boolean;
  portion_limit: number;
  portion_used: number;
  prep_minutes: number;
  product: {
    id: string;
    title: string;
    description: string;
    category: string;
    image_url: string;
  };
}

interface CustomSection {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  product_ids: string[];
  order_index: number;
  is_active: boolean;
}

export default function SellerPublicProfile({ sellerId }: SellerPublicProfileProps) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Cargar datos del vendedor y productos
  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  const loadSellerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar información del vendedor
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .eq('is_seller', true)
        .single();

      if (sellerError) {
        console.error('Error cargando vendedor:', sellerError);
        setError('Vendedor no encontrado');
        return;
      }

      setSeller(sellerData);

      // Cargar productos del vendedor
      const { data: productsData, error: productsError } = await supabase
        .from('seller_products')
        .select(`
          id,
          product_id,
          seller_id,
          price_cents,
          stock,
          active,
          inventory_mode,
          available_today,
          sold_out,
          portion_limit,
          portion_used,
          prep_minutes,
          product:products!inner(
            id,
            title,
            description,
            category,
            image_url
          )
        `)
        .eq('seller_id', sellerId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error cargando productos:', productsError);
        setError('Error cargando productos');
        return;
      }

      setProducts(productsData || []);

      // Cargar secciones personalizadas
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('seller_custom_sections')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (sectionsError) {
        console.error('Error cargando secciones:', sectionsError);
        // No es crítico, continuar sin secciones personalizadas
      } else {
        setCustomSections(sectionsData || []);
      }

    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error cargando datos del vendedor');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar productos por categoría
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.product.category || 'Otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Obtener categorías únicas
  const categories = Object.keys(productsByCategory).sort();

  // Función para agregar al carrito
  const handleAddToCart = (product: Product) => {
    try {
      const cartItem = {
        id: product.product_id,
        title: product.product.title,
        price: product.price_cents,
        image: product.product.image_url || '/images/placeholder.jpg',
        seller_id: product.seller_id,
        seller_name: seller?.name || 'Vendedor',
        quantity: 1
      };

      // Obtener carrito actual
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = currentCart.findIndex((item: any) => 
        item.id === cartItem.id && item.seller_id === cartItem.seller_id
      );

      if (existingItemIndex >= 0) {
        // Incrementar cantidad
        currentCart[existingItemIndex].quantity += 1;
      } else {
        // Agregar nuevo item
        currentCart.push(cartItem);
      }

      // Guardar en localStorage
      localStorage.setItem('cart', JSON.stringify(currentCart));

      // Disparar evento de actualización del carrito
      window.dispatchEvent(new CustomEvent('cart-updated'));

      // Mostrar notificación
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      notification.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          ¡${product.product.title} agregado al carrito!
        </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
      }, 100);
      
      setTimeout(() => {
        notification.classList.remove('translate-x-0');
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);

    } catch (error) {
      console.error('Error agregando al carrito:', error);
    }
  };

  // Formatear precio
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil del vendedor...</p>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendedor no encontrado</h1>
          <p className="text-gray-600 mb-4">{error || 'Este vendedor no existe o no está disponible'}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  const avatarUrl = getUserAvatar({
    avatar_url: seller.avatar_url,
    is_seller: true,
    gender: seller.gender
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header del vendedor */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <img 
              src={avatarUrl}
              alt={seller.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                e.currentTarget.src = '/store-icon.png';
              }}
            />
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
              seller.is_active ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              <span className={`w-3 h-3 rounded-full ${seller.is_active ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></span>
            </div>
          </div>

          {/* Información */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{seller.name}</h1>
                <p className="text-gray-600 mb-4">{seller.description || 'Tienda de barrio con productos frescos y de calidad'}</p>
                
                {/* Estado */}
                <div className="flex items-center gap-4 text-sm">
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    seller.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${seller.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    {seller.is_active ? 'Abierto' : 'Cerrado'}
                  </span>
                  
                  {seller.business_hours && (
                    <span className="text-gray-600">🕒 {seller.business_hours}</span>
                  )}
                  
                  {seller.delivery_zone && (
                    <span className="text-gray-600">🚚 {seller.delivery_zone}</span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <button 
                  onClick={() => window.history.back()}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Volver
                </button>
                <a 
                  href="/carrito"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Carrito
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones personalizadas */}
      {customSections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Secciones Especiales</h2>
          <div className="space-y-8">
            {customSections.map(section => {
              const sectionProducts = products.filter(p => 
                section.product_ids.includes(p.product_id)
              );
              
              if (sectionProducts.length === 0) return null;

              return (
                <div key={section.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{section.name}</h3>
                    {section.description && (
                      <p className="text-gray-600">{section.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {sectionProducts.map(product => (
                      <div key={product.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden">
                          <img
                            src={product.product.image_url || '/images/placeholder.jpg'}
                            alt={product.product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                            }}
                          />
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                          {product.product.title}
                        </h4>
                        <p className="text-lg font-bold text-blue-600 mb-3">
                          {formatPrice(product.price_cents)}
                        </p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!seller.is_active || (product.inventory_mode === 'availability' && (!product.available_today || product.sold_out))}
                          className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {!seller.is_active ? 'Tienda cerrada' : 
                           product.inventory_mode === 'availability' && (!product.available_today || product.sold_out) ? 'No disponible' :
                           'Agregar'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Productos por categoría */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <span className="text-gray-600">{products.length} productos disponibles</span>
        </div>

        {/* Filtros de categoría */}
        {categories.length > 1 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2 min-w-max">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔥 Todos ({products.length})
              </button>
              {categories.map(category => {
                const count = productsByCategory[category]?.length || 0;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid de productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(selectedCategory ? productsByCategory[selectedCategory] || [] : products).map(product => (
            <div key={product.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden">
                <img
                  src={product.product.image_url || '/images/placeholder.jpg'}
                  alt={product.product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                  }}
                />
              </div>
              <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                {product.product.title}
              </h4>
              <p className="text-lg font-bold text-blue-600 mb-3">
                {formatPrice(product.price_cents)}
              </p>
              <button
                onClick={() => handleAddToCart(product)}
                disabled={!seller.is_active || (product.inventory_mode === 'availability' && (!product.available_today || product.sold_out))}
                className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {!seller.is_active ? 'Tienda cerrada' : 
                 product.inventory_mode === 'availability' && (!product.available_today || product.sold_out) ? 'No disponible' :
                 'Agregar'}
              </button>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hay productos disponibles</h3>
            <p className="text-gray-600">Este vendedor aún no ha agregado productos a su tienda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
