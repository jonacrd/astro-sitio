import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface MenuProduct {
  product_id: string;
  seller_id: string;
  available_today: boolean;
  portion_limit: number | null;
  portion_used: number;
  sold_out: boolean;
  prep_minutes: number | null;
  last_available_on: string | null;
  product: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    category: string;
  };
  price_cents: number;
}

export default function DailyMenuManager() {
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  useEffect(() => {
    loadMenuProducts();
  }, []);

  const loadMenuProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('seller_products')
        .select(`
          seller_id,
          product_id,
          price_cents,
          available_today,
          portion_limit,
          portion_used,
          sold_out,
          prep_minutes,
          last_available_on,
          product:products!inner (
            id,
            title,
            description,
            category,
            image_url
          )
        `)
        .eq('seller_id', user.id)
        .eq('inventory_mode', 'availability')
        .order('available_today', { ascending: false })
        .order('product.title', { ascending: true });

      if (error) throw error;

      setMenuProducts(data || []);
    } catch (error) {
      console.error('❌ Error cargando menú:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (productId: string, updates: any) => {
    try {
      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const response = await fetch('/api/seller/menu/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          productId,
          ...updates
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error actualizando producto');
      }

      await loadMenuProducts();
      setEditingProduct(null);
      
    } catch (error: any) {
      console.error('❌ Error actualizando producto:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBatchSave = async () => {
    try {
      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const updates = menuProducts.map(p => ({
        productId: p.product_id,
        availableToday: p.available_today,
        portionLimit: p.portion_limit,
        soldOut: p.sold_out,
        prepMinutes: p.prep_minutes
      }));

      const response = await fetch('/api/seller/menu/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ batchUpdate: updates })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en actualización en lote');
      }

      alert('✅ Todos los productos actualizados');
      await loadMenuProducts();
      
    } catch (error: any) {
      console.error('❌ Error en actualización en lote:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cents / 100);
  };

  const updateLocalProduct = (productId: string, updates: Partial<MenuProduct>) => {
    setMenuProducts(prev => 
      prev.map(p => p.product_id === productId ? { ...p, ...updates } : p)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando menú del día...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Menú del Día</h1>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString('es-CL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <a 
            href="/dashboard" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Volver
          </a>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-4 py-6">
        {menuProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay productos de menú</h3>
            <p className="text-gray-500 mb-4">
              Los productos de menú se crean desde "Mis Productos" cambiando el modo de inventario a "Disponibilidad"
            </p>
            <a 
              href="/dashboard/mis-productos" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Mis Productos
            </a>
          </div>
        ) : (
          <>
            {/* Botón guardar todos */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-400">
                {menuProducts.filter(p => p.available_today).length} de {menuProducts.length} disponibles hoy
              </p>
              <button
                onClick={handleBatchSave}
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    Guardar Todos
                  </>
                )}
              </button>
            </div>

            {/* Lista de productos */}
            <div className="space-y-4">
              {menuProducts.map((product) => (
                <div 
                  key={product.product_id} 
                  className={`bg-gray-800 rounded-lg p-4 ${
                    product.available_today ? 'ring-2 ring-green-500/30' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Imagen */}
                    <div className="flex-shrink-0">
                      <img
                        src={product.product.image_url}
                        alt={product.product.title}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white text-lg">
                            {product.product.title}
                          </h3>
                          <p className="text-sm text-gray-400">{product.product.category}</p>
                          <p className="text-lg font-bold text-green-400 mt-1">
                            {formatPrice(product.price_cents)}
                          </p>
                        </div>
                        
                        {/* Toggle Disponible Hoy */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.available_today}
                            onChange={(e) => {
                              const newValue = e.target.checked;
                              updateLocalProduct(product.product_id, { available_today: newValue });
                              handleUpdateProduct(product.product_id, { availableToday: newValue });
                            }}
                            className="w-5 h-5 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                          />
                          <span className={`text-sm font-medium ${
                            product.available_today ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            {product.available_today ? '✅ Disponible hoy' : 'No disponible'}
                          </span>
                        </label>
                      </div>

                      {/* Controles */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Cupo del día */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Cupo del día (opcional)
                          </label>
                          <input
                            type="number"
                            value={product.portion_limit || ''}
                            onChange={(e) => updateLocalProduct(product.product_id, { 
                              portion_limit: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            onBlur={(e) => handleUpdateProduct(product.product_id, {
                              portionLimit: e.target.value ? parseInt(e.target.value) : null
                            })}
                            placeholder="Sin límite"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Usado / Total */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Vendidos hoy
                          </label>
                          <div className="p-2 bg-gray-700 border border-gray-600 rounded-lg">
                            <p className="text-white text-sm font-medium">
                              {product.portion_used} 
                              {product.portion_limit && ` / ${product.portion_limit}`}
                            </p>
                            {product.portion_limit && (
                              <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    product.portion_used >= product.portion_limit 
                                      ? 'bg-red-500' 
                                      : product.portion_used / product.portion_limit > 0.8
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min((product.portion_used / product.portion_limit) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tiempo de preparación */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Minutos de prep.
                          </label>
                          <input
                            type="number"
                            value={product.prep_minutes || ''}
                            onChange={(e) => updateLocalProduct(product.product_id, { 
                              prep_minutes: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            onBlur={(e) => handleUpdateProduct(product.product_id, {
                              prepMinutes: e.target.value ? parseInt(e.target.value) : null
                            })}
                            placeholder="15"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Toggle Agotado */}
                      <div className="mt-3 flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.sold_out}
                            onChange={(e) => {
                              const newValue = e.target.checked;
                              updateLocalProduct(product.product_id, { sold_out: newValue });
                              handleUpdateProduct(product.product_id, { soldOut: newValue });
                            }}
                            className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                          />
                          <span className={`text-sm ${product.sold_out ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                            {product.sold_out ? '🚫 Agotado hoy' : 'Marcar como agotado'}
                          </span>
                        </label>

                        {product.last_available_on && (
                          <span className="text-xs text-gray-500">
                            Último disponible: {new Date(product.last_available_on).toLocaleDateString('es-CL')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

