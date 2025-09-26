import React, { useState } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUser } from '../../lib/session';

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
}

interface BuyerOrderActionsProps {
  order: Order;
  onStatusChange: () => void;
}

export default function BuyerOrderActions({ order, onStatusChange }: BuyerOrderActionsProps) {
  const [loading, setLoading] = useState(false);

  const confirmReceipt = async () => {
    setLoading(true);
    
    try {
      const user = await getUser();
      if (!user) {
        alert('No hay usuario autenticado');
        return;
      }

      // Usar la función RPC para confirmar recepción
      const { data, error } = await supabase.rpc('confirm_receipt_by_buyer', {
        p_order_id: order.id,
        p_buyer_id: user.id
      });

      if (error) {
        throw error;
      }

      // Crear notificación para el vendedor
      try {
        // Obtener el seller_id del pedido
        const { data: orderData } = await supabase
          .from('orders')
          .select('seller_id')
          .eq('id', order.id)
          .single();

        if (orderData?.seller_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: orderData.seller_id,
              type: 'order_completed',
              title: '¡Pedido Completado!',
              message: 'El comprador ha confirmado la recepción del pedido.',
              order_id: order.id
            });
        }
      } catch (notifError) {
        console.log('⚠️ No se pudo crear notificación:', notifError);
      }

      alert('¡Recepción confirmada exitosamente!');
      onStatusChange();
    } catch (err: any) {
      console.error('Error confirmando recepción:', err);
      alert('Error al confirmar recepción: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
      return;
    }

    setLoading(true);
    
    try {
      const user = await getUser();
      if (!user) {
        alert('No hay usuario autenticado');
        return;
      }

      // Actualizar el status del pedido a 'cancelled'
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', order.id);

      if (error) {
        throw error;
      }

      // Crear notificación para el vendedor
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('seller_id')
          .eq('id', order.id)
          .single();

        if (orderData?.seller_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: orderData.seller_id,
              type: 'order_cancelled',
              title: 'Pedido Cancelado',
              message: 'El comprador ha cancelado el pedido.',
              order_id: order.id
            });
        }
      } catch (notifError) {
        console.log('⚠️ No se pudo crear notificación:', notifError);
      }

      alert('¡Pedido cancelado exitosamente!');
      onStatusChange();
    } catch (err: any) {
      console.error('Error cancelando pedido:', err);
      alert('Error al cancelar pedido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    switch (order.status) {
      case 'pending':
        return 'Tu pedido está pendiente de confirmación por el vendedor';
      case 'confirmed':
        return 'Tu pedido ha sido confirmado y está en preparación';
      case 'delivered':
        return 'Tu pedido ha sido entregado. Por favor, confirma la recepción';
      case 'completed':
        return 'Pedido completado exitosamente';
      case 'cancelled':
        return 'Pedido cancelado';
      default:
        return 'Estado desconocido';
    }
  };

  const getStatusColor = () => {
    switch (order.status) {
      case 'pending':
        return 'text-yellow-600';
      case 'confirmed':
        return 'text-blue-600';
      case 'delivered':
        return 'text-green-600';
      case 'completed':
        return 'text-gray-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Pedido #{order.id.substring(0, 8)}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(order.created_at).toLocaleString('es-ES')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            ${(order.total_cents / 100).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusMessage()}
        </p>
      </div>

      <div className="flex space-x-2">
        {order.status === 'delivered' && (
          <button
            onClick={confirmReceipt}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Confirmando...' : 'Confirmar Recepción'}
          </button>
        )}
        
        {(order.status === 'pending' || order.status === 'confirmed') && (
          <button
            onClick={cancelOrder}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cancelando...' : 'Cancelar Pedido'}
          </button>
        )}
        
        {order.status === 'completed' && (
          <span className="text-green-600 font-medium">
            ✅ Pedido completado
          </span>
        )}
        
        {order.status === 'cancelled' && (
          <span className="text-red-600 font-medium">
            ❌ Pedido cancelado
          </span>
        )}
      </div>
    </div>
  );
}
