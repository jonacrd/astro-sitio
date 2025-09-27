import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import PointsRedemption from './PointsRedemption';

interface Order {
  id: string;
  total_cents: number;
  status: string;
  payment_status?: string;
  payment_method: string;
  created_at: string;
  expires_at?: string;
  points_awarded?: number;
  seller: {
    name: string;
    phone: string;
  };
}

interface EnhancedOrderCardProps {
  order: Order;
  onStatusChange?: () => void;
  showPointsInfo?: boolean;
  showRedemption?: boolean;
  className?: string;
}

export default function EnhancedOrderCard({ 
  order, 
  onStatusChange, 
  showPointsInfo = true,
  showRedemption = false,
  className = '' 
}: EnhancedOrderCardProps) {
  const [pointsInfo, setPointsInfo] = useState<any>(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [canRedeem, setCanRedeem] = useState(false);

  useEffect(() => {
    if (showPointsInfo) {
      loadPointsInfo();
    }
    if (showRedemption) {
      checkRedemptionEligibility();
    }
  }, [order.id, showPointsInfo, showRedemption]);

  const loadPointsInfo = async () => {
    try {
      setLoadingPoints(true);
      
      // Obtener información de puntos para este pedido
      const { data: pointsHistory, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('order_id', order.id)
        .single();

      if (!error && pointsHistory) {
        setPointsInfo(pointsHistory);
      }
    } catch (err) {
      console.error('Error cargando información de puntos:', err);
    } finally {
      setLoadingPoints(false);
    }
  };

  const checkRedemptionEligibility = async () => {
    try {
      // Verificar si el pedido es elegible para canje de puntos
      const canRedeemStatuses = ['placed', 'seller_confirmed'];
      setCanRedeem(canRedeemStatuses.includes(order.status));
    } catch (err) {
      console.error('Error verificando elegibilidad de canje:', err);
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

  const getStatusColor = (status: string) => {
    const colors = {
      'placed': 'text-blue-600 bg-blue-100',
      'seller_confirmed': 'text-green-600 bg-green-100',
      'delivered': 'text-purple-600 bg-purple-100',
      'completed': 'text-gray-600 bg-gray-100',
      'cancelled:no_payment': 'text-red-600 bg-red-100',
      'cancelled:payment_rejected': 'text-red-600 bg-red-100',
      'pending': 'text-yellow-600 bg-yellow-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getStatusMessage = (status: string) => {
    const messages = {
      'placed': 'Pedido realizado',
      'seller_confirmed': 'Confirmado por vendedor',
      'delivered': 'Entregado',
      'completed': 'Completado',
      'cancelled:no_payment': 'Cancelado - Sin pago',
      'cancelled:payment_rejected': 'Cancelado - Pago rechazado',
      'pending': 'Pendiente'
    };
    return messages[status as keyof typeof messages] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'awaiting_transfer': 'text-blue-600 bg-blue-100',
      'pending_review': 'text-orange-600 bg-orange-100',
      'confirmed': 'text-green-600 bg-green-100',
      'rejected': 'text-red-600 bg-red-100',
      'refunded': 'text-purple-600 bg-purple-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getPaymentStatusMessage = (status: string) => {
    const messages = {
      'pending': 'Pago pendiente',
      'awaiting_transfer': 'Esperando transferencia',
      'pending_review': 'Revisando comprobante',
      'confirmed': 'Pago confirmado',
      'rejected': 'Pago rechazado',
      'refunded': 'Pago reembolsado'
    };
    return messages[status as keyof typeof messages] || status;
  };

  const isExpired = order.expires_at && new Date(order.expires_at) < new Date();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header del pedido */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Pedido #{order.id.substring(0, 8)}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(order.created_at).toLocaleString('es-ES')}
          </p>
          <p className="text-sm text-gray-500">
            Vendedor: {order.seller?.name || 'N/A'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(order.total_cents)}
          </div>
          {order.points_awarded && (
            <div className="text-sm text-green-600 font-medium">
              +{order.points_awarded} puntos
            </div>
          )}
        </div>
      </div>

      {/* Estados del pedido */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {getStatusMessage(order.status)}
          </span>
          {order.payment_status && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
              {getPaymentStatusMessage(order.payment_status)}
            </span>
          )}
        </div>
        
        {/* Indicador de expiración */}
        {order.expires_at && (
          <div className={`text-xs ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
            {isExpired ? (
              '⏰ Pedido expirado'
            ) : (
              `⏰ Expira: ${new Date(order.expires_at).toLocaleString('es-ES')}`
            )}
          </div>
        )}
      </div>

      {/* Información de puntos */}
      {showPointsInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Puntos</span>
            </div>
            {loadingPoints ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
            ) : pointsInfo ? (
              <div className="text-sm">
                <span className="text-green-600 font-medium">+{pointsInfo.points_earned || 0} ganados</span>
                {pointsInfo.points_spent && (
                  <span className="text-red-600 ml-2">-{pointsInfo.points_spent} gastados</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Sin información de puntos</span>
            )}
          </div>
          
          {pointsInfo?.description && (
            <p className="text-xs text-gray-600 mt-1">{pointsInfo.description}</p>
          )}
        </div>
      )}

      {/* Información de pago */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Método de pago</span>
          </div>
          <span className="text-sm text-gray-600 capitalize">
            {order.payment_method === 'transfer' ? 'Transferencia' : order.payment_method}
          </span>
        </div>
      </div>

      {/* Opciones de canje de puntos */}
      {showRedemption && canRedeem && (
        <div className="mb-4">
          <PointsRedemption
            orderId={order.id}
            sellerId={order.seller_id || ''}
            onRedemptionSuccess={(discount, points) => {
              console.log('Puntos canjeados:', { discount, points });
              if (onStatusChange) onStatusChange();
            }}
            onRedemptionError={(error) => {
              console.error('Error canjeando puntos:', error);
            }}
          />
        </div>
      )}

      {/* Acciones del pedido */}
      <div className="flex flex-wrap gap-2">
        {order.status === 'placed' && order.payment_method === 'transfer' && (
          <button
            onClick={() => {
              // Abrir modal o navegar a subir comprobante
              alert('Funcionalidad de subir comprobante - próximamente');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            📤 Subir Comprobante
          </button>
        )}
        
        {order.status === 'seller_confirmed' && (
          <button
            onClick={() => {
              // Confirmar recepción
              alert('Funcionalidad de confirmar recepción - próximamente');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            ✅ Confirmar Recepción
          </button>
        )}

        <button
          onClick={() => {
            // Ver detalles del pedido
            alert('Funcionalidad de ver detalles - próximamente');
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          👁️ Ver Detalles
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>ID: {order.id}</span>
          <span>Método: {order.payment_method}</span>
        </div>
      </div>
    </div>
  );
}
