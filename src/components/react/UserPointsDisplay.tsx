import React, { useState, useEffect } from 'react';
import { getUser } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

interface UserPointsDisplayProps {
  className?: string;
}

export default function UserPointsDisplay({ className = "" }: UserPointsDisplayProps) {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserPoints();
  }, []);

  const loadUserPoints = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      // Obtener puntos totales del usuario
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('points, seller_id, seller:profiles(name)')
        .eq('user_id', user.id);

      if (pointsError) {
        console.error('Error cargando puntos:', pointsError);
        setError('Error cargando puntos');
        return;
      }

      // Sumar todos los puntos
      const totalPoints = pointsData?.reduce((sum, item) => sum + item.points, 0) || 0;
      setPoints(totalPoints);

    } catch (err: any) {
      console.error('Error cargando puntos del usuario:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-purple-700">Cargando puntos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="text-red-600">⚠️</div>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 text-white rounded-full p-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-800">Mis Puntos</h3>
            <p className="text-sm text-purple-600">Acumulados por compras</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-purple-800">
            {points.toLocaleString()}
          </div>
          <div className="text-sm text-purple-600">
            puntos disponibles
          </div>
        </div>
      </div>
      
      {points > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="text-sm text-purple-700">
            💡 <strong>Valor:</strong> ${(points * 1000).toLocaleString()} pesos en descuentos
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Cada punto equivale a $1,000 pesos de descuento
          </div>
        </div>
      )}
    </div>
  );
}