import React, { useState, useEffect, useCallback } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  order_id?: string;
  created_at: string;
  read_at?: string;
}

interface RealTimeNotificationsProps {
  userId: string;
  onNotificationReceived?: (notification: Notification) => void;
}

export default function RealTimeNotifications({ userId, onNotificationReceived }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Simular conexión WebSocket (en producción sería real)
  useEffect(() => {
    if (!userId) return;

    console.log('🔔 Iniciando notificaciones en tiempo real para usuario:', userId);

    // Simular conexión WebSocket
    setIsConnected(true);

    // Polling cada 5 segundos para simular notificaciones en tiempo real
    const interval = setInterval(async () => {
      try {
        await checkForNewNotifications();
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    }, 5000);

    // Cargar notificaciones iniciales
    loadNotifications();

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkForNewNotifications = async () => {
    try {
      const since = lastChecked ? lastChecked.toISOString() : new Date(Date.now() - 60000).toISOString();
      const response = await fetch(`/api/notifications?userId=${userId}&since=${since}`);
      const data = await response.json();

      if (data.success && data.notifications) {
        const newNotifications = data.notifications.filter((notif: Notification) => 
          !notifications.find(n => n.id === notif.id)
        );

        if (newNotifications.length > 0) {
          console.log('🔔 Nuevas notificaciones recibidas:', newNotifications);
          
          // Agregar nuevas notificaciones al inicio
          setNotifications(prev => [...newNotifications, ...prev]);
          setLastChecked(new Date());

          // Notificar al componente padre
          newNotifications.forEach(notif => {
            if (onNotificationReceived) {
              onNotificationReceived(notif);
            }
          });

          // Mostrar notificación del navegador si está disponible
          if ('Notification' in window && Notification.permission === 'granted') {
            newNotifications.forEach(notif => {
              new Notification(notif.title, {
                body: notif.message,
                icon: '/favicon.svg',
                tag: notif.id
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking new notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, read_at: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({
            ...notif,
            read_at: notif.read_at || new Date().toISOString()
          }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }
  };

  // Solicitar permiso de notificaciones al cargar
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_placed':
        return '🛒';
      case 'payment_confirmed':
        return '✅';
      case 'payment_rejected':
        return '❌';
      case 'order_cancelled':
        return '🚫';
      case 'new_order':
        return '📦';
      case 'payment_receipt_uploaded':
        return '📄';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_confirmed':
        return 'text-green-400';
      case 'payment_rejected':
      case 'order_cancelled':
        return 'text-red-400';
      case 'new_order':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  return (
    <div className="space-y-4">
      {/* Estado de conexión */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-400">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        {notifications.some(n => !n.read_at) && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No hay notificaciones</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-gray-700 rounded-lg p-3 border-l-4 ${
                notification.read_at ? 'border-gray-600' : 'border-blue-500'
              } ${!notification.read_at ? 'bg-gray-700' : 'bg-gray-800'}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-lg">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mt-1 break-words">
                    {notification.message}
                  </p>
                  
                  {notification.order_id && (
                    <div className="mt-2">
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                        Pedido #{notification.order_id.slice(0, 8)}
                      </span>
                    </div>
                  )}
                </div>

                {!notification.read_at && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-gray-500 hover:text-white transition-colors"
                    title="Marcar como leída"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón para recargar manualmente */}
      <div className="text-center">
        <button
          onClick={loadNotifications}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Actualizar notificaciones
        </button>
      </div>
    </div>
  );
}



