import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface Notification {
  id: string;
  type: 'order_confirmed' | 'order_delivered' | 'points_earned';
  title: string;
  message: string;
  order_id?: string;
  read_at?: string;
  created_at: string;
  order_status?: string;
  total_cents?: number;
}

interface BuyerNotificationsProps {
  className?: string;
  showUnreadOnly?: boolean;
}

export default function BuyerNotifications({ 
  className = '', 
  showUnreadOnly = false 
}: BuyerNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [showUnreadOnly]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('buyer_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (showUnreadOnly) {
        query = query.is('read_at', null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error cargando notificaciones:', err);
      // En lugar de mostrar error, mostrar estado vacío
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err: any) {
      console.error('Error marcando como leída:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read_at)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          !notif.read_at 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err: any) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  const confirmReceipt = async (orderId: string) => {
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('No hay usuario autenticado');
        return;
      }

      const { data, error } = await supabase.rpc('confirm_receipt_by_buyer', {
        p_order_id: orderId,
        p_buyer_id: user.id
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        alert('¡Recepción confirmada exitosamente!');
        loadNotifications();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      console.error('Error confirmando recepción:', err);
      alert('Error al confirmar recepción: ' + err.message);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return '✅';
      case 'order_delivered':
        return '📦';
      case 'points_earned':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return 'bg-blue-50 border-blue-200';
      case 'order_delivered':
        return 'bg-green-50 border-green-200';
      case 'points_earned':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <h3 className="font-semibold mb-2">Error al cargar notificaciones</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadNotifications}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 0 0-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0 1 15 0v5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Notificaciones</h2>
            <p className="text-sm text-gray-500">Mantente al día con tus pedidos</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={markAllAsRead}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50"
            >
              Marcar todas
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 0 0-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0 1 15 0v5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay notificaciones</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {showUnreadOnly 
              ? 'No tienes notificaciones sin leer en este momento'
              : 'Cuando hagas pedidos, recibirás notificaciones aquí'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`border-l-4 rounded-r-lg p-4 transition-all duration-200 hover:shadow-md ${
                notification.read_at 
                  ? 'bg-gray-50 border-gray-200 border-l-gray-300' 
                  : getNotificationColor(notification.type) + ' border-l-4'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  notification.read_at ? 'bg-gray-200' : 'bg-blue-100'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${
                        notification.read_at ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className={`text-sm mt-1 leading-relaxed ${
                        notification.read_at ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      {notification.total_cents && (
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          💰 Total: {formatPrice(notification.total_cents)}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-500 mb-2">
                        {formatDate(notification.created_at)}
                      </p>
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {notification.type === 'order_delivered' && notification.order_id && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => confirmReceipt(notification.order_id!)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        ✅ Confirmar Recepción
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
