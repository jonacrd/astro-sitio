import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { VAPID_PUBLIC_KEY } from '../../lib/vapid-config';

export default function QuickPushButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const activateNotifications = async () => {
    if (!isSupported) {
      alert('Tu navegador no soporta notificaciones push');
      return;
    }

    setLoading(true);

    try {
      // Pedir permiso
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        alert('Necesitas otorgar permisos de notificaciones');
        return;
      }

      // Verificar autenticación
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Debes iniciar sesión para activar notificaciones');
        window.dispatchEvent(new CustomEvent('show-login-modal'));
        return;
      }

      // Registrar service worker y suscribirse
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      // Guardar en BD
      const subJSON = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subJSON.endpoint,
          p256dh: subJSON.keys?.p256dh || '',
          auth: subJSON.keys?.auth || '',
          user_agent: navigator.userAgent
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error:', error);
        alert('Error al guardar suscripción: ' + error.message);
      } else {
        alert('¡Notificaciones activadas! ✅');
      }

    } catch (err: any) {
      console.error('Error:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (permission === 'granted') {
    return (
      <button
        className="fixed bottom-20 right-4 bg-green-500 text-white p-4 rounded-full shadow-lg z-40 hover:bg-green-600 transition-colors"
        title="Notificaciones activadas"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={activateNotifications}
      disabled={loading}
      className="fixed bottom-20 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg z-40 hover:bg-blue-600 transition-all hover:scale-110 disabled:opacity-50 animate-pulse"
      title="Activar notificaciones"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}

