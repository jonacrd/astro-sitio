import React, { useState, useEffect } from 'react';
import { getUser } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

interface Product {
  id: string;
  product_id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  price_cents: number;
  stock: number;
  active: boolean;
  updated_at: string;
}

interface SellerStats {
  totalProducts: number;
  activeProducts: number;
  totalStock: number;
  lowStockProducts: number;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalStock: 0,
    lowStockProducts: 0
  });
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      // Usar API para obtener productos
      const response = await fetch('/api/seller/products/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError('Error al cargar productos: ' + errorData.error);
        return;
      }

      const data = await response.json();
      if (!data.success) {
        setError('Error al cargar productos: ' + data.error);
        return;
      }

      const formattedProducts = data.data.products;
      setProducts(formattedProducts);

      // Calcular estadísticas
      const totalProducts = formattedProducts.length;
      const activeProducts = formattedProducts.filter(p => p.active).length;
      const totalStock = formattedProducts.reduce((sum, p) => sum + p.stock, 0);
      const lowStockProducts = formattedProducts.filter(p => p.stock <= 5).length;

      setStats({
        totalProducts,
        activeProducts,
        totalStock,
        lowStockProducts
      });

    } catch (err: any) {
      console.error('Error cargando productos:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    try {
      const user = await getUser();
      if (!user) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/seller/products/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          productId,
          active: !currentActive
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error al actualizar producto: ' + errorData.error);
        return;
      }

      // Recargar productos
      await loadProducts();
    } catch (err: any) {
      console.error('Error actualizando producto:', err);
      alert('Error inesperado: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const user = await getUser();
      if (!user) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/seller/products/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          productId,
          active: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error al eliminar producto: ' + errorData.error);
        return;
      }

      // Recargar productos
      await loadProducts();
    } catch (err: any) {
      console.error('Error eliminando producto:', err);
      alert('Error inesperado: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error: {error}</p>
        <button 
          onClick={loadProducts}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Productos</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Productos Activos</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Stock Total</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Stock Bajo</h3>
          <p className="text-3xl font-bold text-red-600">{stats.lowStockProducts}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Mis Productos</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Agregar Producto
            </button>
            <button
              onClick={loadProducts}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tienes productos aún.</p>
            <button
              onClick={() => setShowAddProduct(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Agregar tu primer producto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.image_url ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.image_url}
                              alt={product.title}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Sin imagen</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(product.price_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleActive(product.id, product.active)}
                          className={`px-3 py-1 rounded-md text-xs ${
                            product.active 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {product.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-xs hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar producto */}
      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onProductAdded={loadProducts}
        />
      )}
    </div>
  );
}

// Componente para agregar productos
function AddProductModal({ onClose, onProductAdded }: { onClose: () => void; onProductAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'minimarket', 'comida', 'bebidas', 'tecnologia', 'servicios', 'ropa', 'belleza'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !price || !stock) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      let imageUrl = null;

      // Subir imagen si existe
      if (image) {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', image);
        formData.append('productId', 'temp'); // Temporal, se actualizará después

        const uploadResponse = await fetch('/api/seller/products/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          setError('Error subiendo imagen: ' + errorData.error);
          return;
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.data.imageUrl;
        setUploading(false);
      }

      // Crear producto usando API
      const response = await fetch('/api/seller/products/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          image_url: imageUrl,
          price_cents: Math.round(parseFloat(price) * 100),
          stock: parseInt(stock),
          active: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError('Error agregando producto: ' + errorData.error);
        return;
      }

      alert('¡Producto agregado exitosamente!');
      onProductAdded();
      onClose();
    } catch (err: any) {
      console.error('Error agregando producto:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Agregar Producto</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del producto
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen del producto
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {uploading && (
                <p className="text-sm text-blue-600 mt-1">Subiendo imagen...</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Agregando...' : 'Agregar Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
