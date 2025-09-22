import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface UpgradeToSellerProps {
  onUpgrade: () => void;
}

export default function UpgradeToSeller({ onUpgrade }: UpgradeToSellerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      const { error } = await supabase.from('profiles').update({ 
        is_seller: true 
      }).eq('id', user.id);

      if (error) {
        setError('Error al actualizar perfil: ' + error.message);
        return;
      }

      alert('¡Ahora eres vendedor! Accede a tu dashboard.');
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
