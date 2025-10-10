import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUserAvatar } from '../../lib/avatar-utils';

interface SellerProfile {
  id: string;
  name: string;
  description: string;
  business_hours: string;
  delivery_zone: string;
  minimum_order: number;
  delivery_fee: number;
  avatar_url: string;
  gender: string;
}

interface CustomSection {
  id: string;
  name: string;
  description: string;
  product_ids: string[];
  order_index: number;
  is_active: boolean;
}

interface Product {
  id: string;
  product_id: string;
  title: string;
  image_url: string;
  price_cents: number;
  active: boolean;
}

export default function SellerPublicProfileManager() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    description: '',
    business_hours: '',
    delivery_zone: '',
    minimum_order: 0,
    delivery_fee: 0
  });

  // Estados para secciones
  const [newSection, setNewSection] = useState({
    name: '',
    description: '',
    product_ids: [] as string[]
  });
  const [showNewSection, setShowNewSection] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No estás autenticado');
        return;
      }

      // Cargar perfil del vendedor
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .eq('is_seller', true)
        .single();

      if (profileError) {
        setError('No eres un vendedor o no tienes perfil');
        return;
      }

      setProfile(profileData);
      setFormData({
        description: profileData.description || '',
        business_hours: profileData.business_hours || '',
        delivery_zone: profileData.delivery_zone || '',
        minimum_order: profileData.minimum_order || 0,
        delivery_fee: profileData.delivery_fee || 0
      });

      // Cargar secciones personalizadas
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('seller_custom_sections')
        .select('*')
        .eq('seller_id', user.id)
        .order('order_index', { ascending: true });

      if (!sectionsError) {
        setCustomSections(sectionsData || []);
      }

      // Cargar productos del vendedor
      const { data: productsData, error: productsError } = await supabase
        .from('seller_products')
        .select(`
          id,
          product_id,
          price_cents,
          active,
          product:products!inner(
            id,
            title,
            image_url
          )
        `)
        .eq('seller_id', user.id)
        .eq('active', true);

      if (!productsError) {
        setProducts(productsData?.map(p => ({
          id: p.id,
          product_id: p.product_id,
          title: p.product.title,
          image_url: p.product.image_url,
          price_cents: p.price_cents,
          active: p.active
        })) || []);
      }

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error cargando datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          description: formData.description,
          business_hours: formData.business_hours,
          delivery_zone: formData.delivery_zone,
          minimum_order: formData.minimum_order,
          delivery_fee: formData.delivery_fee
        })
        .eq('id', user.id);

      if (error) {
        setError('Error guardando perfil: ' + error.message);
        return;
      }

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error guardando perfil:', err);
      setError('Error inesperado guardando perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSection = async () => {
    try {
      if (!newSection.name.trim()) {
        setError('El nombre de la sección es requerido');
        return;
      }

      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('seller_custom_sections')
        .insert({
          seller_id: user.id,
          name: newSection.name.trim(),
          description: newSection.description.trim() || null,
          product_ids: newSection.product_ids,
          order_index: customSections.length + 1
        });

      if (error) {
        setError('Error creando sección: ' + error.message);
        return;
      }

      setNewSection({ name: '', description: '', product_ids: [] });
      setShowNewSection(false);
      await loadData(); // Recargar datos
      setSuccess('Sección creada correctamente');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error creando sección:', err);
      setError('Error inesperado creando sección');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sección?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('seller_custom_sections')
        .delete()
        .eq('id', sectionId);

      if (error) {
        setError('Error eliminando sección: ' + error.message);
        return;
      }

      await loadData(); // Recargar datos
      setSuccess('Sección eliminada correctamente');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error eliminando sección:', err);
      setError('Error inesperado eliminando sección');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProductInSection = (productId: string) => {
    setNewSection(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }));
  };

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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <a href="/dashboard" className="text-blue-600 hover:text-blue-700">
          ← Volver al dashboard
        </a>
      </div>
    );
  }

  const avatarUrl = getUserAvatar({
    avatar_url: profile?.avatar_url,
    is_seller: true,
    gender: profile?.gender
  });

  return (
    <div className="space-y-8">
      {/* Notificaciones */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-green-400 mr-3">✅</div>
            <div>
              <h3 className="text-green-800 font-medium">Éxito</h3>
              <p className="text-green-700 text-sm mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa del perfil público */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Vista Previa del Perfil Público</h2>
          <a 
            href={`/vendedor/${profile?.id}`}
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver perfil público →
          </a>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <img 
            src={avatarUrl}
            alt={profile?.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            onError={(e) => {
              e.currentTarget.src = '/store-icon.png';
            }}
          />
          <div>
            <h3 className="text-lg font-bold text-gray-900">{profile?.name}</h3>
            <p className="text-gray-600 text-sm">{formData.description || 'Sin descripción'}</p>
            <div className="flex gap-4 text-xs text-gray-500 mt-1">
              {formData.business_hours && <span>🕒 {formData.business_hours}</span>}
              {formData.delivery_zone && <span>🚚 {formData.delivery_zone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Configuración del perfil */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Información del Perfil</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de la tienda
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe tu tienda, especialidades, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horarios de atención
            </label>
            <input
              type="text"
              value={formData.business_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, business_hours: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Lun-Vie 8:00-18:00, Sáb 9:00-15:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zona de entrega
            </label>
            <input
              type="text"
              value={formData.delivery_zone}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_zone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Barrio Centro, Zona Norte"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pedido mínimo (pesos)
            </label>
            <input
              type="number"
              value={formData.minimum_order}
              onChange={(e) => setFormData(prev => ({ ...prev, minimum_order: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo de entrega (pesos)
            </label>
            <input
              type="number"
              value={formData.delivery_fee}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Secciones personalizadas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Secciones Personalizadas</h2>
          <button
            onClick={() => setShowNewSection(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Nueva Sección
          </button>
        </div>

        {/* Lista de secciones existentes */}
        <div className="space-y-4">
          {customSections.map(section => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{section.name}</h3>
                  {section.description && (
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {section.product_ids.length} productos
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="px-3 py-1 text-red-600 hover:text-red-700 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {customSections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📂</div>
              <p>No tienes secciones personalizadas</p>
              <p className="text-sm">Crea secciones como "Más vendidos", "Caseros", etc.</p>
            </div>
          )}
        </div>

        {/* Formulario para nueva sección */}
        {showNewSection && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nueva Sección</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la sección
                </label>
                <input
                  type="text"
                  value={newSection.name}
                  onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Más vendidos, Caseros, Ofertas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={newSection.description}
                  onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción de la sección"
                />
              </div>
            </div>

            {/* Selección de productos */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Productos en esta sección
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {products.map(product => (
                  <label key={product.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSection.product_ids.includes(product.product_id)}
                      onChange={() => handleToggleProductInSection(product.product_id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden mr-2 float-left">
                        <img
                          src={product.image_url || '/images/placeholder.jpg'}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">{formatPrice(product.price_cents)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateSection}
                disabled={saving || !newSection.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Creando...' : 'Crear Sección'}
              </button>
              <button
                onClick={() => {
                  setShowNewSection(false);
                  setNewSection({ name: '', description: '', product_ids: [] });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




