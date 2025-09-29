import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      const { user, type } = event.detail;
      
      if (type === 'login' && user) {
        addNotification({
          type: 'success',
          message: `¡Bienvenido, ${user.email}!`
        });
      } else if (type === 'logout') {
        addNotification({
          type: 'info',
          message: 'Sesión cerrada correctamente'
        });
      }
    };

    const handleOrderUpdate = (event: CustomEvent) => {
      const { orderId, newStatus } = event.detail;
      
      addNotification({
        type: 'info',
        message: `Tu pedido #${orderId} ahora está en estado: ${newStatus}`,
        duration: 5000
      });
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    window.addEventListener('order-status-updated', handleOrderUpdate as EventListener);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    };
  }, []);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}