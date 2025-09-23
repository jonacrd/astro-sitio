import React, { useState, useEffect } from 'react';
import { getUser } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

interface UpgradeToSellerProps {
  onUpgrade: () => void;
}

export default function UpgradeToSeller({ onUpgrade }: UpgradeToSellerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Verificar autenticación al montar
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getUser();
        if (!user) {
          setError('No hay usuario autenticado');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setError('Error verificando autenticación');
      } finally {
        setIsInitialized(true);
      }
    }
    checkAuth();
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Verificando autenticación...');
      const user = await getUser();
      
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        setError('No hay usuario autenticado. Por favor inicia sesión primero.');
        return;
      }

      console.log('✅ Usuario autenticado:', user.email);

      console.log('🔄 Actualizando perfil a vendedor...');
      const { error } = await supabase.from('profiles').update({ 
        is_seller: true 
      }).eq('id', user.id);

      if (error) {
        console.error('❌ Error al actualizar perfil:', error);
        setError('Error al actualizar perfil: ' + error.message);
        return;
      }

      console.log('✅ Perfil actualizado a vendedor exitosamente');
      alert('¡Ahora eres vendedor! Accede a tu dashboard.');
      onUpgrade();
    } catch (err: any) {
      console.error('❌ Error inesperado:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Convertirse en Vendedor
      </h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-blue-800 mb-2">¿Qué incluye ser vendedor?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Dashboard personalizado para gestionar productos</li>
            <li>• Control de stock y precios</li>
            <li>• Estadísticas de ventas</li>
            <li>• Gestión de pedidos</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : 'VENDER'}
        </button>
      </div>
    </div>
  );
}
