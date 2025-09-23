import React, { useState, useEffect } from 'react';
import { getUser, getUserProfile } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

interface Profile {
  id: string;
  name: string;
  phone: string;
  is_seller: boolean;
}

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      const profileData = await getUserProfile();
      if (!profileData) {
        setError('No se pudo cargar el perfil');
        return;
      }

      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        phone: profileData.phone || ''
      });
    } catch (err: any) {
      console.error('Error cargando perfil:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const user = await getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error actualizando perfil:', error);
        alert('Error al actualizar perfil: ' + error.message);
        return;
      }

      setProfile(prev => prev ? { ...prev, name: formData.name, phone: formData.phone } : null);
      setEditing(false);
      alert('Perfil actualizado exitosamente');
    } catch (err: any) {
      console.error('Error actualizando perfil:', err);
      alert('Error inesperado: ' + err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || ''
    });
    setEditing(false);
  };

  const handleUpgradeToSeller = async () => {
    if (!confirm('¿Estás seguro de que quieres convertirte en vendedor?')) {
      return;
    }

    try {
      const user = await getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('id', user.id);

      if (error) {
        console.error('Error actualizando a vendedor:', error);
        alert('Error al convertirte en vendedor: ' + error.message);
        return;
      }

      setProfile(prev => prev ? { ...prev, is_seller: true } : null);
      alert('¡Ahora eres vendedor! Puedes acceder a tu dashboard.');
    } catch (err: any) {
      console.error('Error actualizando a vendedor:', err);
      alert('Error inesperado: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error: {error}</p>
        <button 
          onClick={loadProfile}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Información Personal */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Información Personal</h2>
          {!editing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Editar
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <p className="text-lg text-gray-900">{profile?.name || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <p className="text-lg text-gray-900">{profile?.phone || 'No especificado'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Estado de Vendedor */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Estado de Vendedor</h2>
        
        {profile?.is_seller ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-lg font-medium text-green-600">Eres vendedor</span>
            </div>
            <p className="text-gray-600">Puedes gestionar tus productos y ventas desde tu dashboard.</p>
            <div className="flex space-x-3">
              <a
                href="/dashboard/vendedor"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🏪 Ir al Dashboard
              </a>
              <a
                href="/dashboard/vendedor"
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                📦 Gestionar Productos
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-lg font-medium text-gray-600">No eres vendedor</span>
            </div>
            <p className="text-gray-600">
              Conviértete en vendedor para gestionar tus productos, controlar stock y vender en la plataforma.
            </p>
            <button
              onClick={handleUpgradeToSeller}
              className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              🚀 Convertirse en Vendedor
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas (solo para vendedores) */}
      {profile?.is_seller && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Estadísticas Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Productos Activos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Ventas Hoy</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Stock Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🏠</span>
              <div>
                <div className="font-medium">Ir al Inicio</div>
                <div className="text-sm text-gray-600">Ver productos y comprar</div>
              </div>
            </div>
          </a>
          
          {profile?.is_seller ? (
            <a
              href="/dashboard/vendedor"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-medium">Dashboard Vendedor</div>
                  <div className="text-sm text-gray-600">Gestionar productos y ventas</div>
                </div>
              </div>
            </a>
          ) : (
            <button
              onClick={handleUpgradeToSeller}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <div className="font-medium">Convertirse en Vendedor</div>
                  <div className="text-sm text-gray-600">Empezar a vender productos</div>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
