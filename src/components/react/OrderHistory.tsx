import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUser, getUserProfile } from '../../lib/session';

interface Order {
  id: string;
  total_cents: number;
  status: string;
  created_at: string;
  payment_method: string;
  buyer_name?: string;
  buyer_phone?: string;
  seller_name?: string;
  seller_phone?: string;
  item_count: number;
}

interface OrderHistoryProps {
  userType: 'buyer' | 'seller';
  className?: string;
}

export default function OrderHistory({ userType, className = '' }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    
    // Escuchar cambios en el estado de pedidos
    const handleOrderUpdate = () => {
      loadOrders();
    };
    
    window.addEventListener('order-updated', handleOrderUpdate);
    return () => window.removeEventListener('order-updated', handleOrderUpdate);
  }, [userType]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      let query;
      
      if (userType === 'buyer') {
        // Pedidos del comprador
        query = supabase
          .from('orders')
          .select(`
            id,
            total_cents,
            status,
            created_at,
            payment_method,
            seller:profiles!orders_seller_id_fkey(name, phone)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
      } else {
        // Pedidos del vendedor
        query = supabase
          .from('orders')
          .select(`
            id,
            total_cents,
            status,
            created_at,
            payment_method,
            buyer:profiles!orders_user_id_fkey(name, phone)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Formatear datos
      const formattedOrders = data?.map(order => ({
        id: order.id,
        total_cents: order.total_cents,
        status: order.status,
        created_at: order.created_at,
        payment_method: order.payment_method,
        buyer_name: userType === 'buyer' ? 'Tú' : order.buyer?.name || 'Comprador',
        buyer_phone: userType === 'buyer' ? '' : order.buyer?.phone || '',
        seller_name: userType === 'seller' ? 'Tú' : order.seller?.name || 'Vendedor',
        seller_phone: userType === 'seller' ? '' : order.seller?.phone || '',
        item_count: 1 // Por ahora asumimos 1 item
      })) || [];

      setOrders(formattedOrders);
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const getStatusMessage = (status: string) => {
    if (userType === 'buyer') {
      switch (status) {
        case 'pending':
          return 'Esperando confirmación del vendedor';
        case 'confirmed':
          return 'Pedido confirmado, en preparación';
        case 'delivered':
          return 'Pedido entregado, confirma la recepción';
        case 'completed':
          return 'Pedido completado exitosamente';
        case 'cancelled':
          return 'Pedido cancelado';
        default:
          return 'Estado desconocido';
      }
    } else {
      switch (status) {
        case 'pending':
          return 'Esperando tu confirmación';
        case 'confirmed':
          return 'Pedido confirmado, prepara para entrega';
        case 'delivered':
          return 'Pedido entregado, esperando confirmación del comprador';
        case 'completed':
          return 'Pedido completado exitosamente';
        case 'cancelled':
          return 'Pedido cancelado';
        default:
          return 'Estado desconocido';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <h3 className="font-semibold mb-2">Error cargando historial</h3>
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
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {userType === 'buyer' ? 'Mi Historial de Compras' : 'Historial de Ventas'}
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          {userType === 'buyer' 
            ? 'Todos tus pedidos y compras realizadas'
            : 'Todos los pedidos recibidos y vendidos'
          }
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No tienes {userType === 'buyer' ? 'compras' : 'ventas'} registradas</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Pedido #{order.id.substring(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    ${(order.total_cents / 100).toFixed(2)}
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  {getStatusMessage(order.status)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">
                    {userType === 'buyer' ? 'Vendedor:' : 'Comprador:'}
                  </p>
                  <p className="text-gray-600">
                    {userType === 'buyer' ? order.seller_name : order.buyer_name}
                  </p>
                  {(userType === 'buyer' ? order.seller_phone : order.buyer_phone) && (
                    <p className="text-gray-500 text-xs">
                      {userType === 'buyer' ? order.seller_phone : order.buyer_phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-700">Método de pago:</p>
                  <p className="text-gray-600 capitalize">{order.payment_method}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
