import React, { useState, useEffect } from 'react';

interface OrderItem {
  id: string;
  product_title: string;
  price_cents: number;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string;
  total_cents: number;
  payment_method: string;
  status: string;
  delivery_cents?: number;
  created_at: string;
  delivery_address?: string;
  delivery_notes?: string;
  items: OrderItem[];
  buyer?: {
    name: string;
  };
}

export default function SellerOrdersSimple() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/seller/orders-simple');
      const result = await response.json();
      
      if (result.success) {
        let filteredOrders = result.data.orders;
        
        // Aplicar filtro
        if (filter !== 'all') {
          filteredOrders = filteredOrders.filter((order: Order) => order.status === filter);
        }
        
        setOrders(filteredOrders);
        console.log('📋 Pedidos cargados:', filteredOrders.length);
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
      console.log(`🔄 Actualizando pedido ${orderId} a estado: ${newStatus}`);
      
      const response = await fetch('/api/seller/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
            ? { ...order, status: newStatus }
            : order
        ));
        
        console.log(`✅ Pedido ${orderId} actualizado a ${newStatus}`);
        
        // Mostrar notificación de éxito
        const orderCode = orderId.substring(0, 8);
        const statusText = getStatusText(newStatus);
        alert(`✅ Pedido #${orderCode} actualizado a ${statusText}\n\nEl comprador ha sido notificado.`);
        
      } else {
        throw new Error(result.error || 'Error actualizando pedido');
      }
      
    } catch (err: any) {
      console.error('Error actualizando pedido:', err);
      alert('❌ Error actualizando pedido: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'delivered': return 'Entregado';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'delivered', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Todos' : getStatusText(status)}
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Aún no tienes pedidos.' 
              : `No hay pedidos con estado "${getStatusText(filter)}".`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pedido #{order.id.substring(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Cliente: {order.buyer?.name || `ID: ${order.user_id.substring(0, 8)}...`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    ${order.total_cents}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>

              {/* Items del pedido */}
              {order.items && order.items.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Productos:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product_title} x{item.quantity}</span>
                        <span>${item.price_cents * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Información de entrega */}
              {order.delivery_address && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Dirección de entrega:</h4>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      try {
                        const address = JSON.parse(order.delivery_address);
                        return `${address.address}, ${address.city}, ${address.state}`;
                      } catch {
                        return order.delivery_address;
                      }
                    })()}
                  </p>
                </div>
              )}

              {order.delivery_notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Notas:</h4>
                  <p className="text-sm text-gray-600">{order.delivery_notes}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Confirmar Pedido
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Marcar como Entregado
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Marcar como Entregado
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Completar Pedido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
