import React, { useState, useEffect } from 'react';
import { getUser } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

export default function SellerStatusToggle() {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('seller_status')
        .select('online')
        .eq('seller_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading status:', error);
        setError('Error al cargar estado: ' + error.message);
        return;
      }

      setIsOnline(data?.online || false);
    } catch (err: any) {
      console.error('Error loading seller status:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setIsInitialized(true);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await getUser();
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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">🟢</span>
        </div>
        <div>
          <h3 className="text-white font-medium">Estado del Vendedor</h3>
          <p className="text-gray-400 text-sm">
            {isOnline ? 'Activo - Apareces primero en búsquedas' : 'Inactivo - Apareces después en búsquedas'}
          </p>
        </div>
      </div>
      
      {/* Toggle Switch */}
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${!isOnline ? 'text-white' : 'text-gray-400'}`}>
          {!isOnline ? 'OFF' : ''}
        </span>
        
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
            isOnline ? 'bg-green-500' : 'bg-gray-600'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              isOnline ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        
        <span className={`text-sm font-medium ${isOnline ? 'text-white' : 'text-gray-400'}`}>
          {isOnline ? 'ON' : ''}
        </span>
      </div>

      {error && (
        <div className="mt-2 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}