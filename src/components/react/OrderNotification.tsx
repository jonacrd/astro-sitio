import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUser } from '../../lib/session';

interface OrderNotificationProps {
  sellerId: string;
}

export default function OrderNotification({ sellerId }: OrderNotificationProps) {
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;

    const checkNewOrders = async () => {
      try {
        const user = await getUser();
        if (!user) {
          console.log('🔍 OrderNotification: Usuario no encontrado');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log('🔍 OrderNotification: No hay sesión activa');
          return;
        }

        console.log('🔍 OrderNotification: Verificando pedidos para usuario:', user.id);

        const response = await fetch('/api/seller/orders', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        console.log('🔍 OrderNotification: Respuesta del servidor:', response.status);

        if (!response.ok) {
          console.error('❌ OrderNotification: Error en respuesta:', response.status, response.statusText);
          return;
        }

        const result = await response.json();
        
        if (result.success) {
          const pendingOrders = result.data.orders.filter((order: any) => order.status === 'pending');
          setOrderCount(pendingOrders.length);
          setHasNewOrders(pendingOrders.length > 0);
        }
      } catch (error) {
        console.error('Error checking orders:', error);
      } finally {
        setLoading(false);
      }
    };

    checkNewOrders();

    // Verificar cada 30 segundos
    const interval = setInterval(checkNewOrders, 30000);
    return () => clearInterval(interval);
  }, [sellerId]);

  if (loading) {
    return null;
  }

  if (!hasNewOrders) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="font-semibold">
          ¡{orderCount} nuevo{orderCount > 1 ? 's' : ''} pedido{orderCount > 1 ? 's' : ''}!
        </span>
        <a 
          href="/dashboard/pedidos" 
          className="bg-white text-red-500 px-2 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Ver
        </a>
      </div>
    </div>
  );
}








