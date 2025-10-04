import React, { useState, useEffect } from 'react';

interface PointsHistoryEntry {
  id: string;
  seller_id: string;
  order_id: string | null;
  points_earned: number | null;
  points_spent: number | null;
  transaction_type: 'earned' | 'spent';
  description: string;
  created_at: string;
  seller_name?: string;
}

interface SellerPointsSummary {
  seller_id: string;
  seller_name: string;
  total_points: number;
  points_earned: number;
  points_spent: number;
  last_transaction: string;
}

interface PointsHistoryProps {
  userId: string;
  className?: string;
}

export default function PointsHistory({ userId, className = '' }: PointsHistoryProps) {
  const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
  const [summary, setSummary] = useState<SellerPointsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);

  useEffect(() => {
    loadPointsData();
  }, [userId]);

  const loadPointsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar historial de puntos
      const historyResponse = await fetch(`/api/points/history?userId=${userId}`);
      const historyData = await historyResponse.json();

      if (historyData.success) {
        setHistory(historyData.history || []);
      } else {
        setError(historyData.error || 'Error cargando historial');
        return;
      }

      // Cargar resumen por vendedor
      const summaryResponse = await fetch(`/api/points/summary?userId=${userId}`);
      const summaryData = await summaryResponse.json();

      if (summaryData.success) {
        setSummary(summaryData.summary || []);
      }

    } catch (err) {
      console.error('Error cargando datos de puntos:', err);
      setError('Error de conexión');
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

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getTransactionIcon = (type: 'earned' | 'spent') => {
    if (type === 'earned') {
      return (
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
          </svg>
        </div>
      );
    }
  };

  const getTransactionColor = (type: 'earned' | 'spent') => {
    return type === 'earned' ? 'text-green-400' : 'text-red-400';
  };

  const filteredHistory = selectedSeller 
    ? history.filter(entry => entry.seller_id === selectedSeller)
    : history;

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-white">Cargando historial de puntos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-300">{error}</span>
          </div>
          <button
            onClick={loadPointsData}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Historial de Puntos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              showSummary 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showSummary ? 'Ocultar resumen' : 'Mostrar resumen'}
          </button>
        </div>
      </div>

      {/* Resumen por vendedor */}
      {showSummary && summary.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resumen por Vendedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((seller) => (
              <div
                key={seller.seller_id}
                className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSeller === seller.seller_id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-600'
                }`}
                onClick={() => setSelectedSeller(
                  selectedSeller === seller.seller_id ? null : seller.seller_id
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white truncate">{seller.seller_name}</h4>
                  {selectedSeller === seller.seller_id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Puntos actuales:</span>
                    <span className="text-white font-medium">{seller.total_points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ganados:</span>
                    <span className="text-green-400">{seller.points_earned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gastados:</span>
                    <span className="text-red-400">{seller.points_spent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Última transacción:</span>
                    <span className="text-gray-300 text-xs">
                      {new Date(seller.last_transaction).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      {summary.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-gray-400 text-sm">Filtrar por vendedor:</span>
          <select
            value={selectedSeller || ''}
            onChange={(e) => setSelectedSeller(e.target.value || null)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos los vendedores</option>
            {summary.map((seller) => (
              <option key={seller.seller_id} value={seller.seller_id}>
                {seller.seller_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lista de transacciones */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-lg">
              {selectedSeller ? 'No hay transacciones para este vendedor' : 'No hay historial de puntos'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {selectedSeller ? 'Selecciona otro vendedor o ve todos' : 'Las transacciones aparecerán aquí cuando ganes o gastes puntos'}
            </p>
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-700 rounded-lg p-4 flex items-center gap-4"
            >
              {getTransactionIcon(entry.transaction_type)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white font-medium truncate">
                    {entry.seller_name || 'Vendedor'}
                  </h4>
                  <div className={`font-bold ${getTransactionColor(entry.transaction_type)}`}>
                    {entry.transaction_type === 'earned' ? '+' : '-'}
                    {entry.points_earned || entry.points_spent}
                    <span className="text-gray-400 text-sm ml-1">puntos</span>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-1">
                  {entry.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(entry.created_at)}</span>
                  {entry.order_id && (
                    <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded">
                      Pedido #{entry.order_id.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">¿Cómo funcionan los puntos?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Ganas puntos al completar compras en vendedores con sistema de recompensas activo</li>
              <li>Los puntos se pueden canjear por descuentos en futuras compras</li>
              <li>Cada vendedor tiene su propia configuración de puntos</li>
              <li>Los puntos no expiran y se acumulan por vendedor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}




