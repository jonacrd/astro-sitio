import React, { useState, useEffect } from 'react';

interface PointsSummaryCardProps {
  userId: string;
  className?: string;
}

interface SellerSummary {
  seller_id: string;
  seller_name: string;
  total_points: number;
  points_earned: number;
  points_spent: number;
  last_transaction: string;
}

export default function PointsSummaryCard({ userId, className = '' }: PointsSummaryCardProps) {
  const [summary, setSummary] = useState<SellerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadPointsSummary();
  }, [userId]);

  const loadPointsSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/points/summary?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setSummary(data.summary || []);
      } else {
        setError(data.error || 'Error cargando resumen de puntos');
      }
    } catch (err) {
      console.error('Error cargando resumen de puntos:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPoints = summary.reduce((sum, seller) => sum + seller.total_points, 0);

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="ml-2 text-white">Cargando puntos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white text-sm">{error}</span>
          </div>
          <button
            onClick={loadPointsSummary}
            className="text-white hover:text-gray-200 text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-6 h-6 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <div>
            <h3 className="text-gray-700 font-medium">Sin puntos disponibles</h3>
            <p className="text-gray-500 text-sm">Compra en vendedores con sistema de recompensas activo para ganar puntos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <div>
            <h3 className="text-white font-bold text-lg">Mis Puntos</h3>
            <p className="text-yellow-100 text-sm">
              {summary.length} vendedor{summary.length !== 1 ? 'es' : ''} con puntos
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{totalPoints}</div>
          <div className="text-yellow-100 text-sm">puntos totales</div>
        </div>
      </div>

      {/* Resumen por vendedor */}
      <div className="space-y-2">
        {summary.slice(0, expanded ? summary.length : 3).map((seller, index) => (
          <div
            key={seller.seller_id}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">
                    {seller.seller_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-white font-medium">{seller.seller_name}</h4>
                  <p className="text-yellow-100 text-xs">
                    Última transacción: {formatDate(seller.last_transaction)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{seller.total_points}</div>
                <div className="text-yellow-100 text-xs">
                  +{seller.points_earned} -{seller.points_spent}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Mostrar más/menos */}
        {summary.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full bg-white/20 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-white/30 transition-colors"
          >
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium">
                {expanded ? 'Mostrar menos' : `Ver ${summary.length - 3} más`}
              </span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Acción rápida */}
      <div className="mt-4 pt-3 border-t border-white/20">
        <button
          onClick={() => {
            // Navegar al historial completo de puntos
            window.location.href = '/perfil#points-history';
          }}
          className="w-full bg-white text-yellow-600 py-2 px-4 rounded-lg font-medium hover:bg-yellow-50 transition-colors"
        >
          Ver Historial Completo
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-3 text-center">
        <p className="text-yellow-100 text-xs">
          💡 Canjea tus puntos por descuentos en futuras compras
        </p>
      </div>
    </div>
  );
}





