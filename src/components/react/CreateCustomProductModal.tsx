import React, { useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface CreateCustomProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'abastos', name: '🥫 Abastos' },
  { id: 'bebidas', name: '🥤 Bebidas' },
  { id: 'bebidas_alcoholicas', name: '🍺 Bebidas Alcohólicas' },
  { id: 'cereales', name: '🥣 Cereales' },
  { id: 'comida_rapida', name: '🍔 Comida Rápida' },
  { id: 'lacteos', name: '🥛 Lácteos' },
  { id: 'panaderia', name: '🍞 Panadería' },
  { id: 'carnes', name: '🥩 Carnes y Embutidos' },
  { id: 'frutas_verduras', name: '🥬 Frutas y Verduras' },
  { id: 'limpieza', name: '🧹 Limpieza' },
  { id: 'higiene', name: '🧼 Higiene Personal' },
  { id: 'servicios', name: '🛠️ Servicios' },
  { id: 'otros', name: '📦 Otros' }
];

export default function CreateCustomProductModal({ onClose, onSuccess }: CreateCustomProductModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [stock, setStock] = useState('10');
  const [inventoryMode, setInventoryMode] = useState<'count' | 'availability'>('count');
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Solo: JPEG, PNG, WEBP, GIF');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen es demasiado grande. Máximo 5MB');
        return;
      }

      setImageFile(file);
      setError(null);

      // Vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    if (cleanValue === '' || cleanValue === '.') {
      setPrice('0');
      setPriceDisplay('');
      return;
    }

    const digitsOnly = cleanValue.replace(/\./g, '');
    const priceValue = parseInt(digitsOnly) || 0;
    
    setPrice(priceValue.toString());
    setPriceDisplay(cleanValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validar campos
      if (!title.trim()) {
        throw new Error('El título es requerido');
      }
      if (!category) {
        throw new Error('La categoría es requerida');
      }
      if (!price || parseFloat(price) <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }
      if (inventoryMode === 'count' && (!stock || parseInt(stock) < 0)) {
        throw new Error('El stock debe ser mayor o igual a 0');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      let imageUrl = '/images/placeholder.jpg';

      // Subir imagen si hay una
      if (imageFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadResponse = await fetch('/api/seller/products/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Error subiendo imagen');
        }

        imageUrl = uploadResult.url;
        setUploading(false);
      }

      // Crear producto
      const response = await fetch('/api/seller/products/create-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          imageUrl,
          price: parseFloat(price),
          stock: inventoryMode === 'count' ? parseInt(stock) : 0,
          inventoryMode,
          active
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error creando producto');
      }

      alert('✅ Producto creado exitosamente');
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                ✨ Crear Producto Personalizado
              </h2>
              <p className="text-blue-100 text-sm">
                Crea tu propio producto con imagen, precio y descripción
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📸 Imagen del Producto
            </label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  {imageFile ? 'Cambiar imagen' : 'Subir imagen'}
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  JPEG, PNG, WEBP o GIF. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📝 Título del Producto *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Almuerzo Ejecutivo, Corte de Cabello, etc."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📄 Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu producto o servicio..."
              rows={3}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🏷️ Categoría *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Modo de Inventario */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              📦 Tipo de Inventario *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInventoryMode('count')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inventoryMode === 'count'
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold">Stock Numérico</div>
                <div className="text-xs mt-1 opacity-75">
                  Productos con cantidad fija
                </div>
              </button>
              <button
                type="button"
                onClick={() => setInventoryMode('availability')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inventoryMode === 'availability'
                    ? 'border-green-500 bg-green-500/20 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="font-semibold">Disponibilidad</div>
                <div className="text-xs mt-1 opacity-75">
                  Menú del día / Servicios
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                💰 Precio (pesos) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg pointer-events-none">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  placeholder="1.500"
                  className="w-full p-3 pl-8 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Stock (solo si es count) */}
            {inventoryMode === 'count' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  📦 Stock Inicial
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                  placeholder="10"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="active-checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="active-checkbox" className="text-sm text-gray-300 cursor-pointer">
              ✅ Activar producto inmediatamente (visible en el feed)
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-900 px-6 py-4 rounded-b-2xl flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploading}
            className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Subiendo imagen...
              </>
            ) : saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Crear Producto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

