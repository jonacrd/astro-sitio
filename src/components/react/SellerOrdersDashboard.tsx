import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

// Componente para mostrar comprobante de transferencia
const TransferProofViewer = ({ transferProof, orderId }: { transferProof: string, orderId: string }) => {
  const [showModal, setShowModal] = useState(false);

  const downloadProof = () => {
    const link = document.createElement('a');
    link.href = transferProof;
    link.download = `comprobante_${orderId.substring(0, 8)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Comprobante de Transferencia</p>
              <p className="text-xs text-blue-700">Click para ver o descargar</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              Ver
            </button>
            <button
              onClick={downloadProof}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
            >
              Descargar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para ver comprobante */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Comprobante de Transferencia</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img
                src={transferProof}
                alt="Comprobante de transferencia"
                className="w-full h-auto rounded-lg shadow-sm"
              />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={downloadProof}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface Order {
  id: string;
  buyer_id: string;
  total_cents: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  seller_confirmed_at?: string;
  buyer_confirmed_at?: string;
  delivery_confirmed_at?: string;
  payment_method?: 'cash' | 'transfer';
  transfer_proof?: string; // URL o base64 del comprobante
  // delivery_address?: string; // Columna no existe
  // delivery_notes?: string; // Columna no existe
  points_awarded: number;
  buyer_name: string;
  buyer_phone: string;
  item_count: number;
}

interface SellerOrdersDashboardProps {
  className?: string;
}

export default function SellerOrdersDashboard({ className = '' }: SellerOrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
    
    // Escuchar cambios en el estado de pedidos
    const handleOrderUpdate = () => {
      loadOrders();
    };
    
    window.addEventListener('order-updated', handleOrderUpdate);
    return () => window.removeEventListener('order-updated', handleOrderUpdate);
  }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No hay usuario autenticado');
      }

      // Consultar pedidos directamente desde la tabla orders (solo columnas que existen)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          total_cents,
          status,
          created_at,
          payment_method,
          transfer_proof
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Formatear los datos para que coincidan con la interfaz
      const formattedOrders = (data || []).map((order: any) => ({
        id: order.id,
        buyer_id: order.user_id, // Usar user_id como buyer_id
        total_cents: order.total_cents,
        status: order.status,
        created_at: order.created_at,
        payment_method: order.payment_method || 'cash', // Por defecto efectivo
        transfer_proof: order.transfer_proof || null,
        seller_confirmed_at: null, // Columna no existe, usar null
        buyer_confirmed_at: null, // Columna no existe, usar null
        delivery_confirmed_at: null, // Columna no existe, usar null
        // delivery_address: null, // Columna no existe
        // delivery_notes: null, // Columna no existe
        points_awarded: 0, // Columna no existe, usar 0
        buyer_name: 'Comprador', // Por ahora, nombre genérico
        buyer_phone: 'Sin teléfono', // Por ahora, teléfono genérico
        item_count: 1 // Por ahora, asumimos 1 item por pedido
      }));

      let filteredOrders = formattedOrders;
      if (filter !== 'all') {
        filteredOrders = formattedOrders.filter(order => order.status === filter);
      }

      setOrders(filteredOrders);
    } catch (err: any) {
      console.error('Error cargando pedidos:', err);
      setError('Error al cargar pedidos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (orderId: string) => {
    try {
      // Actualizar solo el status (las columnas de timestamp no existen)
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed'
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Crear notificación para el comprador
      try {
        // Obtener el buyer_id del pedido
        const { data: orderData } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', orderId)
          .single();

        if (orderData?.user_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: orderData.user_id,
              type: 'order_confirmed',
              title: '¡Pedido Confirmado!',
              message: 'Tu pedido ha sido confirmado por el vendedor y está en preparación.',
              order_id: orderId
            });
        }
      } catch (notifError) {
        console.log('⚠️ No se pudo crear notificación:', notifError);
        // No fallar si no se puede crear la notificación
      }

      alert('¡Pedido confirmado exitosamente!');
      
      // Disparar evento para actualizar otros componentes
      const orderUpdateEvent = new CustomEvent('order-updated', {
        detail: { orderId, status: 'confirmed' }
      });
      window.dispatchEvent(orderUpdateEvent);
      
      loadOrders();
    } catch (err: any) {
      console.error('Error confirmando pedido:', err);
      alert('Error al confirmar pedido: ' + err.message);
    }
  };

  const confirmDelivery = async (orderId: string) => {
    try {
      // Actualizar solo el status (las columnas de timestamp no existen)
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered'
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Crear notificación para el comprador
      try {
        // Obtener el buyer_id del pedido
        const { data: orderData } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', orderId)
          .single();

        if (orderData?.user_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: orderData.user_id,
              type: 'order_delivered',
              title: '¡Pedido Entregado!',
              message: 'Tu pedido ha sido marcado como entregado por el vendedor. Por favor, confirma la recepción.',
              order_id: orderId
            });
        }
      } catch (notifError) {
        console.log('⚠️ No se pudo crear notificación:', notifError);
        // No fallar si no se puede crear la notificación
      }

      alert('¡Entrega confirmada exitosamente!');
      
      // Disparar evento para actualizar otros componentes
      const orderUpdateEvent = new CustomEvent('order-updated', {
        detail: { orderId, status: 'delivered' }
      });
      window.dispatchEvent(orderUpdateEvent);
      
      loadOrders();
    } catch (err: any) {
      console.error('Error confirmando entrega:', err);
      alert('Error al confirmar entrega: ' + err.message);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
      confirmed: { color: 'bg-blue-100 text-blue-800', text: 'Confirmado' },
      delivered: { color: 'bg-green-100 text-green-800', text: 'Entregado' },
      completed: { color: 'bg-gray-100 text-gray-800', text: 'Completado' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
        // Si es transferencia y hay comprobante, mostrar botón especial
        if (order.payment_method === 'transfer' && order.transfer_proof) {
          return (
            <div className="flex gap-2">
              <button
                onClick={() => confirmOrder(order.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Confirmar Transferencia
              </button>
            </div>
          );
        }
        // Si es transferencia sin comprobante
        if (order.payment_method === 'transfer' && !order.transfer_proof) {
          return (
            <div className="flex gap-2">
              <span className="text-orange-600 font-medium text-sm">
                ⏳ Esperando comprobante
              </span>
            </div>
          );
        }
        // Si es efectivo
        return (
          <button
            onClick={() => confirmOrder(order.id)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirmar Pedido
          </button>
        );
      case 'confirmed':
        return (
          <button
            onClick={() => confirmDelivery(order.id)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirmar Entrega
          </button>
        );
      case 'delivered':
        return (
          <span className="text-green-600 font-medium">
            Esperando confirmación del comprador
          </span>
        );
      case 'completed':
        return (
          <span className="text-gray-600 font-medium">
            Pedido completado
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <h3 className="font-semibold mb-2">Error al cargar pedidos</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadOrders}
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pedidos</h2>
        <div className="flex space-x-2">
          {(['all', 'pending', 'confirmed', 'delivered', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todos' : 
               status === 'pending' ? 'Pendientes' :
               status === 'confirmed' ? 'Confirmados' :
               status === 'delivered' ? 'Entregados' : 'Completados'}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md">
            <h3 className="font-semibold mb-2">No hay pedidos</h3>
            <p className="text-sm">
              {filter === 'all' 
                ? 'No tienes pedidos aún'
                : `No hay pedidos ${filter === 'pending' ? 'pendientes' : 
                   filter === 'confirmed' ? 'confirmados' :
                   filter === 'delivered' ? 'entregados' : 'completados'}`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      Pedido #{order.id.substring(0, 8)}
                    </h3>
                    {/* Indicador de método de pago */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.payment_method === 'transfer' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {order.payment_method === 'transfer' ? '💳 Transferencia' : '💰 Efectivo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {order.buyer_name} • {order.buyer_phone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.item_count} producto{order.item_count !== 1 ? 's' : ''} • {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(order.total_cents)}
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Dirección de entrega - por ahora no disponible */}
              <div className="mb-3 p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-800 mb-1">Dirección de entrega:</h4>
                <p className="text-sm text-gray-600">Dirección no disponible en este momento</p>
              </div>

              {/* Comprobante de transferencia */}
              {order.payment_method === 'transfer' && order.transfer_proof && (
                <TransferProofViewer 
                  transferProof={order.transfer_proof} 
                  orderId={order.id} 
                />
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {order.seller_confirmed_at && (
                    <p>Confirmado: {formatDate(order.seller_confirmed_at)}</p>
                  )}
                  {order.delivery_confirmed_at && (
                    <p>Entregado: {formatDate(order.delivery_confirmed_at)}</p>
                  )}
                  {order.points_awarded > 0 && (
                    <p className="text-green-600 font-medium">
                      Puntos otorgados: {order.points_awarded}
                    </p>
                  )}
                </div>
                <div>
                  {getStatusActions(order)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
