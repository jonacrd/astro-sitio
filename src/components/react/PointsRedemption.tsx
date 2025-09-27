import React, { useState, useEffect } from 'react';

interface PointsRedemptionProps {
  orderId: string;
  sellerId: string;
  onRedemptionSuccess?: (discountCents: number, pointsUsed: number) => void;
  onRedemptionError?: (error: string) => void;
  className?: string;
}

interface RedemptionInfo {
  can_redeem: boolean;
  available_points: number;
  pesos_per_point: number;
  max_points_usable: number;
  max_discount_cents: number;
  order_total_cents: number;
  existing_redemption?: any;
}

export default function PointsRedemption({ 
  orderId, 
  sellerId, 
  onRedemptionSuccess, 
  onRedemptionError,
  className = '' 
}: PointsRedemptionProps) {
  const [redemptionInfo, setRedemptionInfo] = useState<RedemptionInfo | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRedemptionInfo();
  }, [orderId, sellerId]);

  const loadRedemptionInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/points/redeem?orderId=${orderId}&sellerId=${sellerId}`);
      const data = await response.json();

      if (data.success) {
        setRedemptionInfo(data);
        if (data.can_redeem && data.max_points_usable > 0) {
          setPointsToUse(Math.min(100, data.max_points_usable)); // Default a 100 puntos o el máximo
        }
      } else {
        setError(data.error || 'Error cargando información de canje');
      }
    } catch (err) {
      console.error('Error cargando información de canje:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!redemptionInfo || !pointsToUse || pointsToUse <= 0) {
      setError('Selecciona una cantidad válida de puntos');
      return;
    }

    try {
      setRedeeming(true);
      setError(null);

      const response = await fetch('/api/points/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          sellerId,
          pointsToUse
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Puntos canjeados exitosamente:', data);
        
        if (onRedemptionSuccess) {
          onRedemptionSuccess(data.discount_cents, data.points_used);
        }

        // Recargar información
        await loadRedemptionInfo();

        // Mostrar mensaje de éxito
        alert(data.message || 'Puntos canjeados exitosamente');
      } else {
        const errorMsg = data.error || 'Error canjeando puntos';
        setError(errorMsg);
        if (onRedemptionError) {
          onRedemptionError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Error canjeando puntos:', err);
      const errorMsg = 'Error de conexión';
      setError(errorMsg);
      if (onRedemptionError) {
        onRedemptionError(errorMsg);
      }
    } finally {
      setRedeeming(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const calculateDiscount = (points: number) => {
    if (!redemptionInfo) return 0;
    return points * redemptionInfo.pesos_per_point * 100; // Convertir a centavos
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-white">Verificando puntos disponibles...</span>
        </div>
      </div>
    );
  }

  if (error && !redemptionInfo) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-300">{error}</span>
          </div>
          <button
            onClick={loadRedemptionInfo}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!redemptionInfo || !redemptionInfo.can_redeem) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <div>
            <h3 className="text-white font-medium">Puntos no disponibles</h3>
            <p className="text-gray-400 text-sm">
              {redemptionInfo?.available_points === 0 
                ? 'No tienes puntos para este vendedor'
                : 'No se pueden canjear puntos para este pedido'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  const discountCents = calculateDiscount(pointsToUse);
  const newTotalCents = redemptionInfo.order_total_cents - discountCents;

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Canjear Puntos</h3>
      </div>

      {/* Información de puntos disponibles */}
      <div className="bg-gray-700 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Puntos disponibles:</div>
            <div className="text-white font-medium">{redemptionInfo.available_points}</div>
          </div>
          <div>
            <div className="text-gray-400">Valor:</div>
            <div className="text-white font-medium">1 punto = {redemptionInfo.pesos_per_point} pesos</div>
          </div>
        </div>
      </div>

      {/* Selector de puntos */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Puntos a canjear (máximo {redemptionInfo.max_points_usable})
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max={redemptionInfo.max_points_usable}
            value={pointsToUse}
            onChange={(e) => setPointsToUse(parseInt(e.target.value) || 0)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            placeholder="Cantidad de puntos"
          />
          <button
            onClick={() => setPointsToUse(redemptionInfo.max_points_usable)}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
          >
            Máximo
          </button>
        </div>
      </div>

      {/* Resumen del canje */}
      {pointsToUse > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-300">Descuento aplicado:</span>
            <span className="text-green-400 font-medium">{formatPrice(discountCents)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-blue-300">Nuevo total:</span>
            <span className="text-white font-medium">{formatPrice(newTotalCents)}</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Botón de canje */}
      <button
        onClick={handleRedeemPoints}
        disabled={redeeming || pointsToUse <= 0 || pointsToUse > redemptionInfo.max_points_usable}
        className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {redeeming ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Canjeando puntos...
          </div>
        ) : (
          `Canjear ${pointsToUse} puntos por ${formatPrice(discountCents)} de descuento`
        )}
      </button>

      {/* Información adicional */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Los puntos se canjean al momento de confirmar el pedido</p>
        <p>• El descuento se aplica antes del pago final</p>
        <p>• Máximo 50% de descuento del total del pedido</p>
      </div>
    </div>
  );
}