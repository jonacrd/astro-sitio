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

export default function ProductManagerSimple() {
  const [loading, setLoading] = useState(true);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
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
    console.log('🔄 ProductManagerSimple montado');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📡 Cargando datos...');
      setLoading(true);
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        setLoading(false);
        return;
      }
      
      console.log('✅ Usuario autenticado:', user.id);
      
      // Cargar productos del vendedor
      const { data: sellerProductsData, error: sellerError } = await supabase
        .from('seller_products')
        .select(`
          *,
          products (*)
        `)
        .eq('seller_id', user.id);

      if (sellerError) {
        console.error('❌ Error cargando productos del vendedor:', sellerError);
        setSellerProducts([]);
      } else {
        console.log('✅ Productos cargados:', sellerProductsData?.length || 0);
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
        console.log('🏷️ Categorías generadas:', newCategories.length);
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('seller_products')
        .insert({
          seller_id: user.id,
          product_id: product.id,
          price_cents: 0,
          stock: 0,
          active: false
        });

      if (error) throw error;

      // Recargar datos para actualizar categorías dinámicas
      await loadData();
      setShowAddModal(false);
      setSearchTerm('');
      setShowSearchResults(false);

    } catch (error) {
      console.error('❌ Error agregando producto:', error);
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
        {dynamicCategories.length > 1 && (
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
        )}

        {/* Productos */}
        {sellerProducts.length === 0 ? (
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
        ) : (
          <div>
            {activeTab === 'todos' ? (
              // Vista "Todos" - Productos organizados por categoría
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
                        {categoryProducts.map((sellerProduct, index) => (
                          <div key={index} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                              {sellerProduct.products?.image_url ? (
                                <img 
                                  src={sellerProduct.products.image_url} 
                                  alt={sellerProduct.products.title || 'Producto'}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-full flex items-center justify-center" style={{display: sellerProduct.products?.image_url ? 'none' : 'flex'}}>
                                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
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
                              
                              <button className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-yellow-700 transition-colors">
                                Editar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Vista por categoría específica
              <div className="space-y-3">
                {getFilteredProducts().map((sellerProduct, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {sellerProduct.products?.image_url ? (
                        <img 
                          src={sellerProduct.products.image_url} 
                          alt={sellerProduct.products.title || 'Producto'}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center" style={{display: sellerProduct.products?.image_url ? 'none' : 'flex'}}>
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
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
                      
                      <button className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-yellow-700 transition-colors">
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de añadir producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Añadir producto</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar producto
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.length > 2) {
                    handleSearch();
                  } else {
                    setShowSearchResults(false);
                  }
                }}
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
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.title || 'Producto'}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-full flex items-center justify-center" style={{display: product.image_url ? 'none' : 'flex'}}>
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-gray-400">{product.description}</p>
                            </div>
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
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
