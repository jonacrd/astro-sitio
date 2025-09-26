import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUser } from '../../lib/session';

interface PointsSummary {
  total_points: number;
  available_points: number;
  spent_points: number;
}

interface PointsHistory {
  id: string;
  points_earned: number;
  points_spent: number;
  transaction_type: string;
  description: string;
  created_at: string;
  seller_name?: string;
}

interface UserPointsProps {
  className?: string;
  showSummary?: boolean;
}

export default function UserPoints({ 
  className = '', 
  showSummary = true 
}: UserPointsProps) {
  const [pointsSummary, setPointsSummary] = useState<PointsSummary>({
    total_points: 0,
    available_points: 0,
    spent_points: 0
  });
  
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPointsData();
  }, []);

  const loadPointsData = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      // Obtener resumen de puntos desde user_points
      const { data: userPointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id);

      if (userPointsData && userPointsData.length > 0) {
        const totalPoints = userPointsData.reduce((sum, item) => sum + (item.points || 0), 0);
        
        setPointsSummary({
          total_points: totalPoints,
          available_points: totalPoints,
          spent_points: 0
        });
      }

      // Obtener historial
      const { data: historyData } = await supabase
        .from('points_history')
        .select(`
          id,
          points_earned,
          points_spent,
          transaction_type,
          description,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyData) {
        setHistory(historyData.map(item => ({
          ...item,
          seller_name: 'Vendedor'
        })));
      }

    } catch (err: any) {
      console.error('Error cargando puntos:', err);
      setError('Error cargando puntos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return '🎁';
      case 'spent':
        return '💸';
      case 'bonus':
        return '⭐';
      case 'expired':
        return '⏰';
      default:
        return '📝';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'text-green-600';
      case 'spent':
        return 'text-red-600';
      case 'bonus':
        return 'text-yellow-600';
      case 'expired':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
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
              onClick={loadPointsData}
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
                <div className="text-4xl font-bold">{pointsSummary.available_points}</div>
                <div className="text-blue-100 text-sm">puntos disponibles</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Historial de Puntos</h3>
        <div className="text-sm text-gray-500">
          {history.length} transacción{history.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md">
            <h3 className="font-semibold mb-2">No tienes puntos aún</h3>
            <p className="text-sm">
              Realiza compras de $5,000 o más en tiendas con sistema de puntos activado
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTransactionIcon(item.transaction_type)}</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{item.description}</h4>
                    <p className="text-sm text-gray-600">
                      {item.seller_name} • {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {item.points_earned > 0 && (
                    <p className={`font-semibold ${getTransactionColor('earned')}`}>
                      +{item.points_earned} puntos
                    </p>
                  )}
                  {item.points_spent > 0 && (
                    <p className={`font-semibold ${getTransactionColor('spent')}`}>
                      -{item.points_spent} puntos
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSummary && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Información del Sistema de Puntos</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 1 punto = $1,000 pesos de descuento</li>
            <li>• Los puntos se otorgan en compras de $5,000 o más</li>
            <li>• $5,000 = 5 puntos • $10,000 = 10 puntos • $20,000 = 20 puntos</li>
            <li>• Solo en tiendas que tengan activado el sistema de puntos</li>
            <li>• Los puntos no expiran y son acumulables</li>
            <li>• Puedes canjear puntos por descuentos en futuras compras</li>
          </ul>
        </div>
      )}
    </div>
  );
}
