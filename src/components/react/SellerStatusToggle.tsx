import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellerStatusToggle() {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('seller_status')
        .select('online')
        .eq('seller_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading status:', error);
        return;
      }

      setIsOnline(data?.online || false);
    } catch (err) {
      console.error('Error loading seller status:', err);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      const newStatus = !isOnline;

      const { error } = await supabase.from('seller_status').upsert({
        seller_id: user.id,
        online: newStatus
      }, { onConflict: 'seller_id' });

      if (error) {
        setError('Error al actualizar estado: ' + error.message);
        return;
      }

      setIsOnline(newStatus);
    } catch (err: any) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Estado de Disponibilidad
      </h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-gray-700">
            {isOnline ? 'Estoy disponible' : 'No disponible'}
          </span>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isOnline
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? 'Actualizando...' : (isOnline ? 'Desactivar' : 'Activar')}
        </button>
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
