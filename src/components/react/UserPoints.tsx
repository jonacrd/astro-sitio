import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface PointEntry {
  id: string;
  points: number;
  source: 'purchase' | 'referral' | 'bonus';
  description: string;
  created_at: string;
  order_status?: string;
}

interface UserPointsProps {
  className?: string;
  showSummary?: boolean;
}

export default function UserPoints({ 
  className = '', 
  showSummary = true 
}: UserPointsProps) {
  const [points, setPoints] = useState<PointEntry[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = async () => {
    setLoading(true);
    setError(null);

    try {
      // Intentar cargar desde user_points_summary primero
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (pointsError) {
        // Si la vista no existe, intentar cargar desde user_points directamente
        if (pointsError.code === 'PGRST205' || pointsError.message.includes('Could not find the table')) {
          console.log('Vista user_points_summary no existe, cargando desde user_points...');
          
          const { data: userPointsData, error: userPointsError } = await supabase
            .from('user_points')
            .select('*')
            .order('created_at', { ascending: false });

          if (userPointsError) {
            // Si tampoco existe la tabla user_points, mostrar estado vacío
            if (userPointsError.code === 'PGRST205' || userPointsError.message.includes('Could not find the table')) {
              console.log('Tabla user_points no existe, mostrando estado vacío');
              setPoints([]);
              setTotalPoints(0);
              return;
            }
            throw userPointsError;
          }

          setPoints(userPointsData || []);
          const calculatedTotal = userPointsData?.reduce((sum, entry) => sum + entry.points, 0) || 0;
          setTotalPoints(calculatedTotal);
          return;
        }
        throw pointsError;
      }

      setPoints(pointsData || []);

      // Intentar cargar total de puntos del perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_points')
        .single();

      if (profileError) {
        console.warn('Error cargando total de puntos del perfil:', profileError);
        // Calcular total desde los puntos individuales
        const calculatedTotal = pointsData?.reduce((sum, entry) => sum + entry.points, 0) || 0;
        setTotalPoints(calculatedTotal);
      } else {
        setTotalPoints(profileData?.total_points || 0);
      }
    } catch (err: any) {
      console.error('Error cargando puntos:', err);
      // En lugar de mostrar error, mostrar estado vacío
      setPoints([]);
      setTotalPoints(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'purchase':
        return '🛒';
      case 'referral':
        return '👥';
      case 'bonus':
        return '🎁';
      default:
        return '⭐';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'purchase':
        return 'bg-blue-50 border-blue-200';
      case 'referral':
        return 'bg-green-50 border-green-200';
      case 'bonus':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'purchase':
        return 'Compra';
      case 'referral':
        return 'Referido';
      case 'bonus':
        return 'Bonificación';
      default:
        return 'Otro';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando puntos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <h3 className="font-semibold mb-2">Error al cargar puntos</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadPoints}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {showSummary && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Mis Puntos</h2>
                <p className="text-blue-100">Acumula puntos con tus compras</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{totalPoints}</div>
                <div className="text-blue-100 text-sm">puntos totales</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Historial de Puntos</h3>
        <div className="text-sm text-gray-500">
          {points.length} entrada{points.length !== 1 ? 's' : ''}
        </div>
      </div>

      {points.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md">
            <h3 className="font-semibold mb-2">No tienes puntos aún</h3>
            <p className="text-sm">
              Comienza a comprar para ganar puntos y recompensas
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {points.map((entry) => (
            <div 
              key={entry.id} 
              className={`border rounded-lg p-4 ${getSourceColor(entry.source)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getSourceIcon(entry.source)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {entry.description}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {getSourceText(entry.source)} • {formatDate(entry.created_at)}
                    </p>
                    {entry.order_status && (
                      <p className="text-xs text-gray-500">
                        Estado del pedido: {entry.order_status}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    +{entry.points}
                  </div>
                  <div className="text-xs text-gray-500">puntos</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSummary && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">¿Cómo ganar puntos?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 🛒 <strong>Compra:</strong> 1 punto por cada $10.00 gastados</li>
            <li>• 👥 <strong>Referir amigos:</strong> 50 puntos por cada referido</li>
            <li>• 🎁 <strong>Bonificaciones:</strong> Puntos extra en promociones especiales</li>
          </ul>
        </div>
      )}
    </div>
  );
}
