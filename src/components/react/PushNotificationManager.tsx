import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { VAPID_PUBLIC_KEY, NOTIFICATION_CONFIG } from '../../lib/vapid-config';

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 PushNotificationManager montado');
    console.log('📱 Service Worker disponible:', 'serviceWorker' in navigator);
    console.log('📱 PushManager disponible:', 'PushManager' in window);
    console.log('📱 Notification API disponible:', 'Notification' in window);
    
    // Verificar soporte para notificaciones push
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      console.log('✅ Notificaciones push soportadas');
      console.log('🔐 Permiso actual:', Notification.permission);
    } else {
      console.error('❌ Notificaciones push NO soportadas');
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      setError('Las notificaciones push no son compatibles con este navegador');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
      } else {
        setError('Permisos de notificación denegados');
      }
    } catch (err) {
      console.error('Error solicitando permisos:', err);
      setError('Error solicitando permisos de notificación');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      console.log('📝 Iniciando suscripción push...');
      console.log('🔑 VAPID_PUBLIC_KEY:', VAPID_PUBLIC_KEY);
      
      // Registrar Service Worker
      console.log('📝 Registrando Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', registration);

      // Esperar a que el Service Worker esté activo
      console.log('⏳ Esperando a que Service Worker esté activo...');
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker listo');

      // Obtener suscripción push
      console.log('📝 Creando suscripción push...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      console.log('✅ Suscripción push creada:', subscription);
      setSubscription(subscription);
      setIsSubscribed(true);

      // Guardar suscripción en Supabase
      console.log('💾 Guardando suscripción en Supabase...');
      await saveSubscription(subscription);
      console.log('✅ Suscripción guardada en Supabase');

    } catch (err: any) {
      console.error('❌ Error creando suscripción push:', err);
      console.error('❌ Error stack:', err.stack);
      console.error('❌ Error message:', err.message);
      setError('Error creando suscripción push: ' + err.message);
    }
  };

  const saveSubscription = async (subscription: PushSubscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: subscription.toJSON(),
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error guardando suscripción:', error);
        setError('Error guardando suscripción');
      } else {
        console.log('Suscripción guardada en Supabase');
      }
    } catch (err) {
      console.error('Error guardando suscripción:', err);
      setError('Error guardando suscripción');
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);
        console.log('Suscripción push cancelada');
      }
    } catch (err) {
      console.error('Error cancelando suscripción:', err);
      setError('Error cancelando suscripción');
    }
  };

  const sendTestNotification = async () => {
    try {
      // Verificar si hay una suscripción activa
      if (!subscription) {
        setError('No hay suscripción activa. Primero activa las notificaciones.');
        return;
      }

      setLoading(true);
      setError(null);

      // Intentar enviar notificación real a través del backend
      try {
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
          body: {
            title: '¡Notificación de prueba! 🎉',
            body: 'Esta es una notificación de prueba de Town. ¡Funciona perfectamente!',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: 'test-notification',
            data: {
              url: window.location.origin,
              timestamp: new Date().toISOString()
            }
          }
        });

        if (error) {
          console.error('Error enviando notificación real:', error);
          // Fallback a notificación local
          await sendLocalNotification();
        } else {
          console.log('✅ Notificación real enviada:', data);
          showSuccessMessage('¡Notificación enviada a todos los dispositivos!');
        }
      } catch (backendError) {
        console.log('Backend no disponible, usando notificación local');
        // Fallback a notificación local
        await sendLocalNotification();
      }

    } catch (err) {
      console.error('Error enviando notificación:', err);
      setError('Error enviando notificación de prueba');
    } finally {
      setLoading(false);
    }
  };

  const sendLocalNotification = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      
      // Enviar mensaje al service worker para mostrar notificación
      registration.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        notification: {
          title: '¡Notificación de prueba! 🎉',
          body: 'Esta es una notificación de prueba de Town. ¡Funciona perfectamente!',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'test-notification',
          requireInteraction: true,
          actions: [
            {
              action: 'open',
              title: 'Abrir App',
              icon: '/favicon.svg'
            },
            {
              action: 'close',
              title: 'Cerrar',
              icon: '/favicon.svg'
            }
          ]
        }
      });

      console.log('✅ Notificación local enviada');
      showSuccessMessage('¡Notificación local enviada!');
    } else {
      setError('Service Worker no disponible');
    }
  };

  const showSuccessMessage = (message: string) => {
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      notification.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
          ${message}
        </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
      }, 100);
      
      setTimeout(() => {
        notification.classList.remove('translate-x-0');
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800 font-medium">Notificaciones no compatibles</span>
        </div>
        <p className="text-red-700 text-sm mt-1">
          Tu navegador no soporta notificaciones push. Usa Chrome, Firefox o Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-800">Notificaciones Push</h3>
      </div>

      <div className="space-y-4">
        {/* Estado de permisos */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Permisos:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            permission === 'granted' ? 'bg-green-100 text-green-800' :
            permission === 'denied' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {permission === 'granted' ? 'Concedidos' :
             permission === 'denied' ? 'Denegados' : 'No solicitados'}
          </span>
        </div>

        {/* Estado de suscripción */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Suscripción:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isSubscribed ? 'Activa' : 'Inactiva'}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="space-y-2">
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Solicitando...' : 'Activar Notificaciones'}
            </button>
          )}

          {permission === 'granted' && !isSubscribed && (
            <button
              onClick={subscribeToPush}
              disabled={loading}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Suscribiendo...' : 'Suscribirse a Notificaciones'}
            </button>
          )}

          {isSubscribed && (
            <div className="space-y-2">
              <button
                onClick={sendTestNotification}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
              >
                Enviar Notificación de Prueba
              </button>
              <button
                onClick={unsubscribeFromPush}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Desactivar Notificaciones
              </button>
            </div>
          )}
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            <strong>💡 Tip:</strong> Las notificaciones te mantendrán informado sobre el estado de tus pedidos, ofertas especiales y novedades de Town.
          </p>
        </div>
      </div>
    </div>
  );
}
