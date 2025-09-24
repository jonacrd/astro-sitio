import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface Order {
  id: string;
  buyer_id: string;
  total_cents: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  seller_confirmed_at?: string;
  buyer_confirmed_at?: string;
  delivery_confirmed_at?: string;
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
          created_at
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
                  <h3 className="font-semibold text-gray-900">
                    Pedido #{order.id.substring(0, 8)}
                  </h3>
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
