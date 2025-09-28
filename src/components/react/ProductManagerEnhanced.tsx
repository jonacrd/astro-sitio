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

export default function ProductManagerEnhanced() {
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
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('seller_products')
        .select(`
          id,
          product_id,
          price_cents,
          stock,
          active,
          products!inner (
            id,
            title,
            description,
            category,
            image_url
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSellerProducts(data || []);
      
      // Generar categorías dinámicas
      const categories = new Set(data?.map(item => item.products.category) || []);
      const dynamicCats = [
        { id: 'todos', name: 'Todos', icon: '📦' },
        ...Array.from(categories).map(cat => ({
          id: cat,
          name: categoryLabels[cat as keyof typeof categoryLabels] || cat,
          icon: categoryIcons[cat as keyof typeof categoryIcons] || '📦'
        }))
      ];
      setDynamicCategories(dynamicCats);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, description, category, image_url')
        .or(`title.ilike.%${term}%, description.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('❌ Error buscando productos:', error);
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar si el producto ya existe
      const { data: existing } = await supabase
        .from('seller_products')
        .select('id')
        .eq('seller_id', user.id)
        .eq('product_id', product.id)
        .single();

      if (existing) {
        alert('Este producto ya está en tu tienda');
        return;
      }

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

      await loadData();
      setShowAddModal(false);
      setSearchTerm('');
      setSearchResults([]);
      setShowSearchResults(false);

    } catch (error) {
      console.error('❌ Error agregando producto:', error);
    }
  };

  const handleEditProduct = (product: SellerProduct) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (price: number, stock: number, active: boolean) => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('seller_products')
        .update({
          price_cents: price * 100,
          stock: stock,
          active: active
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      await loadData();
      setShowEditModal(false);
      setEditingProduct(null);

    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
    }
  };

  const handleToggleActive = async (product: SellerProduct) => {
    try {
      const { error } = await supabase
        .from('seller_products')
        .update({ active: !product.active })
        .eq('id', product.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
    }
  };

  const getFilteredProducts = () => {
    if (activeTab === 'todos') return sellerProducts;
    return sellerProducts.filter(item => item.products.category === activeTab);
  };

  const getProductsByCategory = (category: string) => {
    if (category === 'todos') return sellerProducts;
    return sellerProducts.filter(item => item.products.category === category);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cents);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Mis Productos</h1>
          </div>
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-4 py-6">
        {/* Título y botón añadir */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Gestión de Productos</h2>
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
        {getFilteredProducts().length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
            <p className="text-gray-500">Agrega productos para comenzar a vender</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredProducts().map((sellerProduct) => (
              <div key={sellerProduct.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {categoryIcons[sellerProduct.products.category as keyof typeof categoryIcons] || '📦'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{sellerProduct.products.title}</h3>
                      <p className="text-sm text-gray-400">{sellerProduct.products.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(sellerProduct)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sellerProduct.active
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {sellerProduct.active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Precio:</span>
                    <span className="text-white font-medium">
                      {sellerProduct.price_cents > 0 
                        ? formatPrice(sellerProduct.price_cents)
                        : 'No configurado'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stock:</span>
                    <span className="text-white font-medium">{sellerProduct.stock}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleEditProduct(sellerProduct)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Configurar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de búsqueda */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Buscar producto</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchProducts(e.target.value);
              }}
              placeholder="Buscar productos..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {showSearchResults && (
              <div className="mt-4 max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg mb-2 cursor-pointer hover:bg-gray-600"
                    onClick={() => handleAddProduct(product)}
                  >
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{product.title}</h4>
                      <p className="text-gray-400 text-sm">{product.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && editingProduct && (
        <EditProductModal
          product={editingProduct}
          onSave={handleUpdateProduct}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

interface EditProductModalProps {
  product: SellerProduct;
  onSave: (price: number, stock: number, active: boolean) => void;
  onClose: () => void;
}

function EditProductModal({ product, onSave, onClose }: EditProductModalProps) {
  const [price, setPrice] = useState(product.price_cents / 100);
  const [stock, setStock] = useState(product.stock);
  const [active, setActive] = useState(product.active);

  const handleSave = () => {
    onSave(price, stock, active);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-4">Configurar Producto</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Precio (pesos)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stock disponible
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm text-gray-300">
              Producto activo en mi tienda
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
