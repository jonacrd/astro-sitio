import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface Notification {
  id: string;
  type: 'order_confirmed' | 'order_delivered' | 'order_cancelled' | 'new_message' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  order_id?: string;
}

interface RealNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function RealNotificationsPanel({ isOpen, onClose, userId }: RealNotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Cargar notificaciones del usuario
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading notifications:', error);
      } else {
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all as read:', error);
      } else {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return '✅';
      case 'order_delivered':
        return '📦';
      case 'order_cancelled':
        return '❌';
      case 'new_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return 'text-green-400';
      case 'order_delivered':
        return 'text-blue-400';
      case 'order_cancelled':
        return 'text-red-400';
      case 'new_message':
        return 'text-purple-400';
      default:
        return 'text-yellow-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-surface/90 backdrop-blur-sm rounded-xl w-full max-w-md mx-auto my-8 shadow-2xl border border-white/10 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="bg-accent text-primary text-xs px-2 py-1 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-accent text-sm font-medium hover:text-accent/80 transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/60">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-white/60">No hay notificaciones</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    notification.read 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-accent/20 hover:bg-accent/30'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-white/70 text-xs mb-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-xs">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                        {notification.order_id && (
                          <span className="text-accent text-xs font-medium">
                            Pedido #{notification.order_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



