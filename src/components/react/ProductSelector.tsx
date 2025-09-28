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

interface ProductSelectorProps {
  sellerId: string;
  onProductsUpdated?: () => void;
}

export default function ProductSelector({ sellerId, onProductsUpdated }: ProductSelectorProps) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  const categories = [
    'all', 'bebidas', 'belleza', 'comida', 'supermercado', 'postres', 'servicios'
  ];

  const categoryLabels = {
    all: 'Todas las categorías',
    bebidas: '🍺 Bebidas',
    belleza: '💄 Belleza y Cuidado',
    comida: '🍕 Comida',
    supermercado: '🛒 Supermercado',
    postres: '🍰 Postres',
    servicios: '🔧 Servicios'
  };

  useEffect(() => {
    loadData();
  }, [sellerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
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

      // Cargar productos del vendedor
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
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setAvailableProducts([]);
      setSellerProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = (availableProducts || []).filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const notAlreadyAdded = !(sellerProducts || []).some(sp => sp.product_id === product.id);
    
    return matchesSearch && matchesCategory && notAlreadyAdded;
  });

  const handleAddProduct = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('seller_products')
        .insert({
          seller_id: sellerId,
          product_id: product.id,
          price_cents: 0, // Precio por defecto, el vendedor lo configurará
          stock: 0, // Stock por defecto, el vendedor lo configurará
          active: false // Inactivo hasta que configure precio y stock
        });

      if (error) throw error;

      // Recargar datos
      await loadData();
      onProductsUpdated?.();
      
      // Actualizar estadísticas
      if (typeof window !== 'undefined' && window.updateProductStats) {
        window.updateProductStats();
      }

    } catch (error) {
      console.error('❌ Error agregando producto:', error);
    }
  };

  const handleEditProduct = (product: SellerProduct) => {
    setEditingProduct(product);
    setNewPrice((product.price_cents / 100).toString());
    setNewStock(product.stock.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('seller_products')
        .update({
          price_cents: Math.round(parseFloat(newPrice) * 100),
          stock: parseInt(newStock),
          active: parseFloat(newPrice) > 0 && parseInt(newStock) > 0
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setEditingProduct(null);
      setNewPrice('');
      setNewStock('');
      await loadData();
      onProductsUpdated?.();
      
      // Actualizar estadísticas
      if (typeof window !== 'undefined' && window.updateProductStats) {
        window.updateProductStats();
      }

    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('seller_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await loadData();
      onProductsUpdated?.();
      
      // Actualizar estadísticas
      if (typeof window !== 'undefined' && window.updateProductStats) {
        window.updateProductStats();
      }

    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar producto
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: jamón, queso, torta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Productos disponibles */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Productos disponibles ({filteredProducts.length})
          </h3>
          <p className="text-sm text-gray-600">
            Selecciona los productos que quieres vender
          </p>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {availableProducts.length === 0 ? (
                <div>
                  <p>No hay productos disponibles en la base de datos</p>
                  <p className="text-sm mt-2">Verifica que los productos se hayan cargado correctamente</p>
                </div>
              ) : (
                <div>
                  <p>No hay productos disponibles con los filtros seleccionados</p>
                  <p className="text-sm mt-2">Intenta cambiar los filtros de búsqueda</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{product.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {categoryLabels[product.category as keyof typeof categoryLabels]}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddProduct(product)}
                      className="ml-2 px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mis productos */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Mis productos ({sellerProducts.length})
          </h3>
          <p className="text-sm text-gray-600">
            Configura precios y stock para tus productos
          </p>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Cargando tus productos...</p>
            </div>
          ) : (sellerProducts || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tienes productos agregados aún
            </div>
          ) : (
            <div className="space-y-4">
              {(sellerProducts || []).map(sellerProduct => (
                <div key={sellerProduct.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {sellerProduct.products?.title || 'Producto sin nombre'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {sellerProduct.products?.description || 'Sin descripción'}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm">
                          <strong>Precio:</strong> ${(sellerProduct.price_cents / 100).toLocaleString('es-CL')}
                        </span>
                        <span className="text-sm">
                          <strong>Stock:</strong> {sellerProduct.stock}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sellerProduct.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sellerProduct.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(sellerProduct)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(sellerProduct.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Configurar {editingProduct.products.title}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (CLP)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Ej: 1500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock disponible
                </label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Ej: 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
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
