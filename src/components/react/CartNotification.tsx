import React, { useState, useEffect } from 'react';

interface CartNotificationProps {}

export default function CartNotification({}: CartNotificationProps) {
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      const { action, itemCount, totalCents } = event.detail;
      
      if (action === 'add') {
        setNotification({
          show: true,
          message: `¡Producto agregado! ${itemCount} productos en tu carrito`,
          type: 'success'
        });
      } else if (action === 'remove') {
        setNotification({
          show: true,
          message: `Producto eliminado del carrito`,
          type: 'success'
        });
      }
      
      // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    };

    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    document.addEventListener('cart-updated', handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
      document.removeEventListener('cart-updated', handleCartUpdate as EventListener);
    };
  }, []);

  if (!notification.show) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`
        p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out
        ${notification.type === 'success' 
          ? 'bg-green-50 border-green-400 text-green-800' 
          : 'bg-red-50 border-red-400 text-red-800'
        }
        ${notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {notification.type === 'success' ? (
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">
              {notification.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
