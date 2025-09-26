import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUser } from '../../lib/session';

interface PointsRedemptionProps {
  sellerId: string;
  orderTotal: number; // en centavos
  onPointsApplied: (discountCents: number, pointsUsed: number) => void;
}

export default function PointsRedemption({ sellerId, orderTotal, onPointsApplied }: PointsRedemptionProps) {
  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [maxPoints, setMaxPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerHasRewards, setSellerHasRewards] = useState(false);

  useEffect(() => {
    loadPointsData();
  }, [sellerId]);

  const loadPointsData = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      // Verificar si el vendedor tiene sistema de puntos activado
      const { data: rewardsConfig } = await supabase
        .from('seller_rewards_config')
        .select('is_active, minimum_purchase_cents')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .single();

      if (!rewardsConfig) {
        setSellerHasRewards(false);
        setLoading(false);
        return;
      }

      setSellerHasRewards(true);

      // Verificar compra mínima
      if (orderTotal < rewardsConfig.minimum_purchase_cents) {
        setError(`Compra mínima para puntos: $${(rewardsConfig.minimum_purchase_cents / 100).toLocaleString('es-CL')}`);
        setLoading(false);
        return;
      }

      // Obtener puntos disponibles del usuario
      const { data: pointsData } = await supabase
        .from('points_history')
        .select('points_earned, points_spent')
        .eq('user_id', user.id);

      if (pointsData) {
        const totalEarned = pointsData.reduce((sum, item) => sum + (item.points_earned || 0), 0);
        const totalSpent = pointsData.reduce((sum, item) => sum + (item.points_spent || 0), 0);
        const available = totalEarned - totalSpent;
        
        setAvailablePoints(available);
        
        // Máximo puntos que se pueden usar (hasta el 50% del total de la compra)
        const maxDiscountCents = Math.floor(orderTotal * 0.5);
        const maxPointsToUse = Math.floor(maxDiscountCents / 35); // 1 punto = 35 pesos
        const actualMaxPoints = Math.min(available, maxPointsToUse);
        
        setMaxPoints(actualMaxPoints);
        setPointsToUse(Math.min(actualMaxPoints, 10)); // Por defecto, usar hasta 10 puntos
      }

    } catch (err: any) {
      console.error('Error cargando puntos:', err);
      setError('Error cargando puntos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(value, maxPoints));
    setPointsToUse(clampedValue);
    
    const discountCents = clampedValue * 35; // 1 punto = 35 pesos
    onPointsApplied(discountCents, clampedValue);
  };

  const formatPesos = (cents: number) => {
    return `$${(cents / 100).toLocaleString('es-CL')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Cargando puntos...</p>
        </div>
      </div>
    );
  }

  if (!sellerHasRewards) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">ℹ️</span>
          <p className="text-gray-600 text-sm">
            Esta tienda no tiene sistema de puntos activado
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-400">⚠️</span>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (availablePoints === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-400">🎁</span>
          <p className="text-blue-600 text-sm">
            No tienes puntos disponibles. Realiza compras de $5,000 o más para ganar puntos.
          </p>
        </div>
      </div>
    );
  }

  const discountCents = pointsToUse * 35;
  const finalTotal = orderTotal - discountCents;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Canjear Puntos</h3>
      
      <div className="space-y-4">
        {/* Información de puntos disponibles */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">Puntos disponibles:</span>
            <span className="text-green-600 font-bold text-lg">{availablePoints}</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Máximo a usar: {maxPoints} puntos (50% del total de la compra)
          </p>
        </div>

        {/* Selector de puntos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Puntos a usar:
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="0"
              max={maxPoints}
              value={pointsToUse}
              onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
              className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => handlePointsChange(maxPoints)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Máximo
            </button>
            <button
              onClick={() => handlePointsChange(0)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              Ninguno
            </button>
          </div>
        </div>

        {/* Resumen del descuento */}
        {pointsToUse > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-800 font-medium">Descuento por puntos:</span>
              <span className="text-blue-600 font-bold">{formatPesos(discountCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">Total final:</span>
              <span className="text-blue-600 font-bold text-lg">{formatPesos(finalTotal)}</span>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              Ahorras {formatPesos(discountCents)} usando {pointsToUse} puntos
            </p>
          </div>
        )}

        {/* Botones de acción rápida */}
        <div className="flex space-x-2">
          {[5, 10, 20, 50].map((amount) => (
            <button
              key={amount}
              onClick={() => handlePointsChange(Math.min(amount, maxPoints))}
              disabled={amount > maxPoints}
              className={`px-3 py-1 rounded-md text-sm ${
                amount > maxPoints
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {amount} pts
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
