import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUser } from '../../lib/session';

interface OrderItem {
  id: string;
  title: string;
  price_cents: number;
  qty: number;
}

interface Order {
  id: string;
  user_id: string;
  total_cents: number;
  payment_method: string;
  status: string;
  delivery_cents?: number;
  created_at: string;
  items: OrderItem[];
  buyer: {
    name: string;
  };
}

export default function SellerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'pending', 'confirmed', 'delivered', 'completed'

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      const response = await fetch('/api/seller/orders', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data.orders);
      } else {
        setError(result.error || 'Error cargando pedidos');
      }
    } catch (err: any) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const user = await getUser();
      if (!user) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/seller/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar la lista de pedidos
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, seller_confirmed_at: newStatus === 'confirmed' ? new Date().toISOString() : order.seller_confirmed_at }
            : order
        ));
      } else {
        alert('Error actualizando pedido: ' + result.error);
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'delivered':
        return 'Entregado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error: {error}</p>
        <button 
          onClick={fetchOrders}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendientes ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Confirmados ({orders.filter(o => o.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'delivered' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Entregados ({orders.filter(o => o.status === 'delivered').length})
          </button>
        </div>
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No hay pedidos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pedido #{order.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatPrice(order.total_cents)}
                  </span>
                </div>
              </div>

              {/* Información del comprador */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Información del Comprador</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre:</p>
                    <p className="font-medium">{order.buyer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID de Usuario:</p>
                    <p className="font-medium text-sm text-gray-500">{order.user_id.slice(-8)}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p>ℹ️ Para obtener información de contacto, el comprador debe completar su perfil</p>
                </div>
              </div>

              {/* Productos */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Productos</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-500">Cantidad: {item.qty}</p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.price_cents * item.qty)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'confirmed')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirmar Pedido
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Marcar como Entregado
                  </button>
                )}
                {order.status === 'delivered' && (
                  <span className="text-green-600 font-medium">
                    Esperando confirmación del comprador
                  </span>
                )}
                {order.status === 'completed' && (
                  <span className="text-gray-600 font-medium">
                    Pedido completado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
