import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
}

interface SellerProduct {
  id: string;
  product_id: string;
  price_cents: number;
  stock: number;
  active: boolean;
  products: Product;
}

interface ProductManagerProps {
  sellerId: string;
}

export default function ProductManager({ sellerId }: ProductManagerProps) {
  const [activeTab, setActiveTab] = useState('todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'base' | 'custom' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [dynamicCategories, setDynamicCategories] = useState([
    { id: 'todos', name: 'Todos', icon: '📦' }
  ]);

  const categoryLabels = {
    supermercado: 'Abarrotes',
    postres: 'Panadería', 
    comida: 'Comida preparada',
    bebidas: 'Bebidas',
    belleza: 'Belleza',
    servicios: 'Servicios'
  };

  const categoryIcons = {
    supermercado: '🛒',
    postres: '🍰',
    comida: '🍕',
    bebidas: '🥤',
    belleza: '💄',
    servicios: '🔧'
  };

  useEffect(() => {
    console.log('🔄 ProductManager useEffect ejecutándose, sellerId:', sellerId);
    loadData();
  }, [sellerId]);

  // Debug: mostrar estado actual
  useEffect(() => {
    console.log('📊 Estado actual:', {
      loading,
      sellerProducts: sellerProducts.length,
      availableProducts: availableProducts.length,
      dynamicCategories: dynamicCategories.length,
      activeTab
    });
  }, [loading, sellerProducts.length, availableProducts.length, dynamicCategories.length, activeTab]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      handleSearch();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Verificar que tenemos sellerId
      if (!sellerId || sellerId === '' || sellerId === 'auto') {
        console.log('⚠️ No hay sellerId, obteniendo usuario actual...');
        
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ No hay usuario autenticado');
          setLoading(false);
          return;
        }
        
        // Usar el ID del usuario como sellerId
        const currentSellerId = user.id;
        console.log('✅ Usando sellerId:', currentSellerId);
        
        // Cargar productos del vendedor con el ID correcto
        const { data: sellerProductsData, error: sellerError } = await supabase
          .from('seller_products')
          .select(`
            *,
            products (*)
          `)
          .eq('seller_id', currentSellerId);

        if (sellerError) {
          console.error('❌ Error cargando productos del vendedor:', sellerError);
          setSellerProducts([]);
        } else {
          setSellerProducts(sellerProductsData || []);
          
          // Generar categorías dinámicas basadas en los productos del vendedor
          const userCategories = new Set();
          (sellerProductsData || []).forEach(sp => {
            if (sp.products?.category) {
              userCategories.add(sp.products.category);
            }
          });

          // Crear categorías dinámicas
          const newCategories = [
            { id: 'todos', name: 'Todos', icon: '📦' }
          ];

          userCategories.forEach(category => {
            newCategories.push({
              id: category,
              name: categoryLabels[category] || category,
              icon: categoryIcons[category] || '📦'
            });
          });

          setDynamicCategories(newCategories);
        }
      } else {
        // Cargar productos del vendedor con sellerId proporcionado
        const { data: sellerProductsData, error: sellerError } = await supabase
          .from('seller_products')
          .select(`
            *,
            products (*)
          `)
          .eq('seller_id', sellerId);

        if (sellerError) {
          console.error('❌ Error cargando productos del vendedor:', sellerError);
          setSellerProducts([]);
        } else {
          setSellerProducts(sellerProductsData || []);
          
          // Generar categorías dinámicas basadas en los productos del vendedor
          const userCategories = new Set();
          (sellerProductsData || []).forEach(sp => {
            if (sp.products?.category) {
              userCategories.add(sp.products.category);
            }
          });

          // Crear categorías dinámicas
          const newCategories = [
            { id: 'todos', name: 'Todos', icon: '📦' }
          ];

          userCategories.forEach(category => {
            newCategories.push({
              id: category,
              name: categoryLabels[category] || category,
              icon: categoryIcons[category] || '📦'
            });
          });

          setDynamicCategories(newCategories);
        }
      }
      
      // Cargar productos disponibles
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('title');

      if (productsError) {
        console.error('❌ Error cargando productos:', productsError);
        setAvailableProducts([]);
      } else {
        setAvailableProducts(products || []);
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setAvailableProducts([]);
      setSellerProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.length < 3) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('title', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error en búsqueda:', error);
        return;
      }

      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('seller_products')
        .insert({
          seller_id: sellerId,
          product_id: product.id,
          price_cents: 0,
          stock: 0,
          active: false
        });

      if (error) throw error;

      // Recargar datos para actualizar categorías dinámicas
      await loadData();
      setShowAddModal(false);
      setAddMode(null);
      setSearchTerm('');
      setShowSearchResults(false);

    } catch (error) {
      console.error('❌ Error agregando producto:', error);
    }
  };

  const handleToggleProduct = async (productId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('seller_products')
        .update({ active: !active })
        .eq('id', productId);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
    }
  };

  const getFilteredProducts = () => {
    if (activeTab === 'todos') {
      return sellerProducts;
    }
    return sellerProducts.filter(sp => sp.products?.category === activeTab);
  };

  const getProductsByCategory = (category: string) => {
    return sellerProducts.filter(sp => sp.products?.category === category);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-white mt-4">Cargando productos...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay productos
  if (sellerProducts.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Vendedor</h1>
            </div>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Título y botón añadir */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Mis productos</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + Añadir producto
            </button>
          </div>

          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">No tienes productos aún</p>
            <p className="text-sm mb-6">Haz clic en "+ Añadir producto" para comenzar a vender</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Agregar mi primer producto
            </button>
          </div>
        </div>

        {/* Modal de añadir producto */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4">Añadir producto</h3>
              
              {!addMode ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setAddMode('base')}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Elegir de productos base
                  </button>
                  <button
                    onClick={() => setAddMode('custom')}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Subir producto personalizado
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : addMode === 'base' ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Buscar producto
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Escribe el nombre del producto..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {showSearchResults && (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {searchResults.map(product => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{product.title}</p>
                            <p className="text-sm text-gray-400">{product.description}</p>
                          </div>
                          <button
                            onClick={() => handleAddProduct(product)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Añadir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setAddMode(null)}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-300 mb-4">Funcionalidad de producto personalizado en desarrollo...</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAddMode(null)}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Vendedor</h1>
          </div>
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Título y botón añadir */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Mis productos</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Añadir producto
          </button>
        </div>

        {/* Tabs de categorías dinámicas */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {dynamicCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Productos por categoría dinámica */}
        {activeTab === 'todos' ? (
          <div className="space-y-6">
            {dynamicCategories.slice(1).map(category => {
              const categoryProducts = getProductsByCategory(category.id);
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-300">
                    {category.icon} {category.name}
                  </h3>
                  <div className="space-y-3">
                    {categoryProducts.map(sellerProduct => (
                      <ProductCard
                        key={sellerProduct.id}
                        sellerProduct={sellerProduct}
                        onToggle={handleToggleProduct}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {getFilteredProducts().map(sellerProduct => (
              <ProductCard
                key={sellerProduct.id}
                sellerProduct={sellerProduct}
                onToggle={handleToggleProduct}
              />
            ))}
          </div>
        )}

        {getFilteredProducts().length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No tienes productos en esta categoría</p>
            <p className="text-sm mt-2">Haz clic en "+ Añadir producto" para comenzar</p>
          </div>
        )}
      </div>

      {/* Modal de añadir producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Añadir producto</h3>
            
            {!addMode ? (
              <div className="space-y-4">
                <button
                  onClick={() => setAddMode('base')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Elegir de productos base
                </button>
                <button
                  onClick={() => setAddMode('custom')}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Subir producto personalizado
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : addMode === 'base' ? (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Buscar producto
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Escribe el nombre del producto..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {showSearchResults && (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-gray-400">{product.description}</p>
                        </div>
                        <button
                          onClick={() => handleAddProduct(product)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Añadir
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setAddMode(null)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 mb-4">Funcionalidad de producto personalizado en desarrollo...</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAddMode(null)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar cada producto
function ProductCard({ sellerProduct, onToggle }: { sellerProduct: SellerProduct; onToggle: (id: string, active: boolean) => void }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium text-white">{sellerProduct.products?.title || 'Sin nombre'}</h4>
        <p className="text-sm text-gray-400">{sellerProduct.stock} stock</p>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          sellerProduct.active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {sellerProduct.active ? 'Activo' : 'Inactivo'}
        </span>
        
        <button
          onClick={() => onToggle(sellerProduct.id, sellerProduct.active)}
          className={`px-3 py-1 rounded text-sm font-medium ${
            sellerProduct.active
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          } transition-colors`}
        >
          {sellerProduct.active ? 'Pausar' : 'Activar'}
        </button>
        
        <button className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-yellow-700 transition-colors">
          Editar
        </button>
      </div>
    </div>
  );
}
