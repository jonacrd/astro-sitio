import React, { useState, useEffect } from 'react';

export default function QuickPushButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }

    // Actualizar el estado del permiso cuando cambie
    const checkPermission = () => {
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    // Revisar cada 2 segundos por si el usuario da permiso
    const interval = setInterval(checkPermission, 2000);

    return () => clearInterval(interval);
  }, []);

  const activateNotifications = async () => {
    if (!isSupported) {
      alert('Tu navegador no soporta notificaciones push');
      return;
    }

    setLoading(true);

    try {
      // @ts-ignore - Esperar a que OneSignal esté listo
      if (typeof window.OneSignalDeferred === 'undefined') {
        alert('OneSignal no está disponible. Recarga la página.');
        setLoading(false);
        return;
      }

      console.log('📱 Mostrando prompt de OneSignal...');
      
      // @ts-ignore
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          // Mostrar el prompt de OneSignal
          await OneSignal.Slidedown.promptPush();
          
          // Esperar 1 segundo para que el usuario responda
          setTimeout(() => {
            setPermission(Notification.permission);
            setLoading(false);
          }, 1000);
        } catch (err: any) {
          console.error('Error en OneSignal prompt:', err);
          setLoading(false);
        }
      });

    } catch (err: any) {
      console.error('Error activando notificaciones:', err);
      alert('Error: ' + err.message);
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
        title="Notificaciones activadas ✅"
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
      title="Click para activar notificaciones"
    >
      {loading ? (
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}
