import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUser } from '../../lib/session';
import ImageUpload from './ImageUpload';

interface Product {
  id: string;
  productId: string;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  priceCents: number;
  stock: number;
  active: boolean;
  updatedAt: string;
}

interface SellerProductManagerProps {
  onProductUpdated?: () => void;
}

export default function SellerProductManager({ onProductUpdated }: SellerProductManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    priceCents: 0,
    stock: 0,
    active: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('seller_products')
        .select(`
          id,
          product_id,
          price_cents,
          stock,
          active,
          updated_at,
          product:products!inner(
            id,
            title,
            description,
            category,
            image_url
          )
        `)
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error('Error cargando productos: ' + error.message);
      }

      const formattedProducts = data?.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        title: item.product.title,
        description: item.product.description,
        category: item.product.category,
        imageUrl: item.product.image_url,
        priceCents: item.price_cents,
        stock: item.stock,
        active: item.active,
        updatedAt: item.updated_at
      })) || [];

      setProducts(formattedProducts);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product.id);
    setEditForm({
      priceCents: product.priceCents,
      stock: product.stock,
      active: product.active
    });
  };

  const handleSave = async (productId: string) => {
    try {
      const user = await getUser();
      if (!user) return;

      const { error } = await supabase
        .from('seller_products')
        .update({
          price_cents: editForm.priceCents,
          stock: editForm.stock,
          active: editForm.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('seller_id', user.id);

      if (error) {
        throw new Error('Error actualizando producto: ' + error.message);
      }

      setEditingProduct(null);
      loadProducts();
      onProductUpdated?.();
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert('Error actualizando producto: ' + err.message);
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
  };

  const handleImageUploaded = (productId: string, imageUrl: string) => {
    // Actualizar la imagen en el estado local
    setProducts(prev => prev.map(product => 
      product.productId === productId 
        ? { ...product, imageUrl }
        : product
    ));
    onProductUpdated?.();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <h3 className="font-semibold mb-2">Error cargando productos</h3>
        <p className="text-sm mb-3">{error}</p>
        <button 
          onClick={loadProducts}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md max-w-md mx-auto">
          <h3 className="font-semibold mb-2">No tienes productos</h3>
          <p className="text-sm mb-4">Agrega productos a tu inventario para empezar a vender</p>
          <button 
            onClick={() => window.location.href = '/dashboard/mis-productos'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Gestionar Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start space-x-4">
            {/* Imagen del producto */}
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Información del producto */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {product.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2 capitalize">
                {product.category}
              </p>
              {product.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* Formulario de edición */}
              {editingProduct === product.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio (centavos)
                      </label>
                      <input
                        type="number"
                        value={editForm.priceCents}
                        onChange={(e) => setEditForm(prev => ({ ...prev, priceCents: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={editForm.stock}
                        onChange={(e) => setEditForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.active}
                        onChange={(e) => setEditForm(prev => ({ ...prev, active: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Activo</span>
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave(product.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-blue-600">
                      ${(product.priceCents / 100).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Stock: {product.stock}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEdit(product)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subir imagen */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Imagen del producto</h4>
            <ImageUpload
              productId={product.productId}
              sellerId={product.id}
              currentImageUrl={product.imageUrl}
              onImageUploaded={(url) => handleImageUploaded(product.productId, url)}
              className="max-w-xs"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
