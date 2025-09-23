import React, { useState, useEffect } from 'react';
import { getUser } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

interface Product {
  id: string;
  title: string;
  category: string;
  image_url?: string;
  description?: string;
  price_cents: number;
}

interface SellerProduct {
  id: string;
  product_id: string;
  price_cents: number;
  stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  products: Product;
}

interface CatalogProduct extends Product {
  created_at: string;
}

export default function SelectSellerProducts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Estado para catálogo global
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  
  // Estado para productos del vendedor
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellerCategory, setSellerCategory] = useState('');
  const [sellerPage, setSellerPage] = useState(0);
  const [sellerHasMore, setSellerHasMore] = useState(false);

  // Verificar autenticación al montar
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getUser();
        if (!currentUser) {
          setError('No hay usuario autenticado');
          return;
        }
        setUser(currentUser);
        loadSellerProducts();
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setError('Error verificando autenticación');
      }
    }
    checkAuth();
  }, []);

  // Cargar productos del vendedor
  const loadSellerProducts = async (reset = false) => {
    if (!user) return;
    
    setSellerLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      const page = reset ? 0 : sellerPage;
      const params = new URLSearchParams({
        limit: '10',
        offset: String(page * 10)
      });

      if (sellerSearch) params.set('q', sellerSearch);
      if (sellerCategory) params.set('category', sellerCategory);

      const response = await fetch(`/api/seller/products/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        setError('Error cargando productos: ' + result.error);
        return;
      }

      if (reset) {
        setSellerProducts(result.data);
        setSellerPage(0);
      } else {
        setSellerProducts(prev => [...prev, ...result.data]);
      }
      
      setSellerHasMore(result.pagination.hasMore);
    } catch (error: any) {
      setError('Error cargando productos: ' + error.message);
    } finally {
      setSellerLoading(false);
    }
  };

  // Cargar catálogo global
  const loadCatalogProducts = async (reset = false) => {
    setCatalogLoading(true);
    try {
      const page = reset ? 0 : catalogPage;
      const params = new URLSearchParams({
        limit: '10',
        offset: String(page * 10)
      });

      if (catalogSearch) params.set('q', catalogSearch);
      if (catalogCategory) params.set('category', catalogCategory);

      const response = await fetch(`/api/catalog/simple?${params}`);
      const result = await response.json();

      if (!result.success) {
        setError('Error cargando catálogo: ' + result.error);
        return;
      }

      if (reset) {
        setCatalogProducts(result.data);
        setCatalogPage(0);
      } else {
        setCatalogProducts(prev => [...prev, ...result.data]);
      }
      
      setCatalogHasMore(result.pagination.hasMore);
    } catch (error: any) {
      setError('Error cargando catálogo: ' + error.message);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Agregar producto al catálogo del vendedor
  const addProductToSeller = async (product: CatalogProduct, price: number, stock: number) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      const response = await fetch('/api/seller/products/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          product_id: product.id,
          price_cents: Math.round(price * 100),
          stock: Math.round(stock),
          active: true
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError('Error agregando producto: ' + result.error);
        return;
      }

      alert('¡Producto agregado exitosamente!');
      loadSellerProducts(true); // Recargar productos del vendedor
    } catch (error: any) {
      setError('Error agregando producto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar producto del vendedor
  const updateSellerProduct = async (sellerProductId: string, updates: Partial<{price_cents: number, stock: number, active: boolean}>) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      const sellerProduct = sellerProducts.find(sp => sp.id === sellerProductId);
      if (!sellerProduct) {
        setError('Producto no encontrado');
        return;
      }

      const response = await fetch('/api/seller/products/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          product_id: sellerProduct.product_id,
          price_cents: updates.price_cents ?? sellerProduct.price_cents,
          stock: updates.stock ?? sellerProduct.stock,
          active: updates.active ?? sellerProduct.active
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError('Error actualizando producto: ' + result.error);
        return;
      }

      alert('¡Producto actualizado exitosamente!');
      loadSellerProducts(true); // Recargar productos del vendedor
    } catch (error: any) {
      setError('Error actualizando producto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Verificando autenticación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Mis Productos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Mis Productos</h2>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={sellerSearch}
            onChange={(e) => setSellerSearch(e.target.value)}
            className="p-2 border rounded-lg"
          />
          <select
            value={sellerCategory}
            onChange={(e) => setSellerCategory(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="">Todas las categorías</option>
            <option value="comida">Comida</option>
            <option value="postres">Postres</option>
            <option value="minimarket">Minimarket</option>
            <option value="bebidas">Bebidas</option>
            <option value="servicios">Servicios</option>
          </select>
          <button
            onClick={() => loadSellerProducts(true)}
            disabled={sellerLoading}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sellerLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Tabla de productos */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
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
              {sellerProducts.map((sp) => (
                <tr key={sp.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {sp.products.image_url && (
                        <img
                          className="h-10 w-10 rounded-full object-cover mr-3"
                          src={sp.products.image_url}
                          alt={sp.products.title}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sp.products.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sp.products.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      defaultValue={sp.price_cents / 100}
                      onBlur={(e) => {
                        const newPrice = parseFloat(e.target.value);
                        if (newPrice !== sp.price_cents / 100) {
                          updateSellerProduct(sp.id, { price_cents: Math.round(newPrice * 100) });
                        }
                      }}
                      className="w-20 p-1 border rounded text-sm"
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      defaultValue={sp.stock}
                      onBlur={(e) => {
                        const newStock = parseInt(e.target.value);
                        if (newStock !== sp.stock) {
                          updateSellerProduct(sp.id, { stock: newStock });
                        }
                      }}
                      className="w-16 p-1 border rounded text-sm"
                      min="0"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => updateSellerProduct(sp.id, { active: !sp.active })}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        sp.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {sp.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                          updateSellerProduct(sp.id, { active: false });
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sellerHasMore && (
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setSellerPage(prev => prev + 1);
                loadSellerProducts();
              }}
              disabled={sellerLoading}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {sellerLoading ? 'Cargando...' : 'Cargar más'}
            </button>
          </div>
        )}
      </div>

      {/* Catálogo Global */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Agregar Productos del Catálogo</h2>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar en catálogo..."
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            className="p-2 border rounded-lg"
          />
          <select
            value={catalogCategory}
            onChange={(e) => setCatalogCategory(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="">Todas las categorías</option>
            <option value="comida">Comida</option>
            <option value="postres">Postres</option>
            <option value="minimarket">Minimarket</option>
            <option value="bebidas">Bebidas</option>
            <option value="servicios">Servicios</option>
          </select>
          <button
            onClick={() => loadCatalogProducts(true)}
            disabled={catalogLoading}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {catalogLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Lista de productos del catálogo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={addProductToSeller}
              loading={loading}
            />
          ))}
        </div>

        {catalogHasMore && (
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setCatalogPage(prev => prev + 1);
                loadCatalogProducts();
              }}
              disabled={catalogLoading}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {catalogLoading ? 'Cargando...' : 'Cargar más'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para tarjeta de producto
function ProductCard({ 
  product, 
  onAdd, 
  loading 
}: { 
  product: CatalogProduct; 
  onAdd: (product: CatalogProduct, price: number, stock: number) => void;
  loading: boolean;
}) {
  const [price, setPrice] = useState(product.price_cents / 100);
  const [stock, setStock] = useState(1);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-32 object-cover rounded mb-3"
        />
      )}
      <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
      {product.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
      )}
      
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio ($)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            className="w-full p-2 border rounded text-sm"
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 0)}
            className="w-full p-2 border rounded text-sm"
            min="0"
          />
        </div>
        <button
          onClick={() => onAdd(product, price, stock)}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Agregando...' : 'Agregar a mi catálogo'}
        </button>
      </div>
    </div>
  );
}
