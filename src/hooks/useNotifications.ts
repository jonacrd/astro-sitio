import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar notificaciones del localStorage al inicializar
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    } else {
      // Notificaciones iniciales
      const initialNotifications: Notification[] = [
        {
          id: '1',
          title: '¡Pedido Confirmado!',
          message: 'Tu pedido #12345 ha sido confirmado y está siendo preparado.',
          type: 'success',
          timestamp: '2 min',
          read: false,
          action: {
            label: 'Ver Pedido',
            onClick: () => console.log('Ver pedido')
          }
        },
        {
          id: '2',
          title: 'Nuevo Producto Disponible',
          message: 'El producto "iPhone 14 Pro" que seguías está disponible nuevamente.',
          type: 'info',
          timestamp: '1 hora',
          read: false,
          action: {
            label: 'Ver Producto',
            onClick: () => console.log('Ver producto')
          }
        },
        {
          id: '3',
          title: 'Descuento Especial',
          message: '¡Aprovecha 20% de descuento en productos seleccionados!',
          type: 'warning',
          timestamp: '3 horas',
          read: true,
          action: {
            label: 'Ver Ofertas',
            onClick: () => console.log('Ver ofertas')
          }
        }
      ];
      setNotifications(initialNotifications);
      localStorage.setItem('notifications', JSON.stringify(initialNotifications));
    }
  }, []);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: 'Ahora',
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return {
    notifications,
    isOpen,
    setIsOpen,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification
  };
}




