import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

/**
 * Prompt para activar notificaciones en el checkout
 */
export default function CheckoutNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkNotifications = async () => {
      try {
        // Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !isMounted) return;

        // Verificar si ya activó notificaciones
        const notificationStatus = localStorage.getItem(`notifications_asked_${user.id}`);
        
        // Si nunca se le preguntó o si dijo "tal vez después"
        if (!notificationStatus || notificationStatus === 'later') {
          // Esperar a que OneSignal esté listo
          // @ts-ignore
          if (typeof window.OneSignalDeferred === 'undefined') {
            setTimeout(checkNotifications, 1000);
            return;
          }

          // @ts-ignore
          window.OneSignalDeferred.push(async function(OneSignal) {
            if (!isMounted) return;

            const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
            
            if (!isPushEnabled) {
              // No tiene notificaciones activadas, mostrar prompt
              setShowPrompt(true);
            }
          });
        }

      } catch (error) {
        console.error('Error verificando notificaciones:', error);
      }
    };

    checkNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleActivate = async () => {
    // Mostrar explicación antes del prompt del navegador
    const shouldProceed = window.confirm(
      '📦 NOTIFICACIONES DE SEGUIMIENTO DE PEDIDO\n\n' +
      '✅ Recibirás alertas cuando:\n' +
      '   1️⃣ El vendedor confirme tu pedido\n' +
      '   2️⃣ Tu pedido esté en preparación\n' +
      '   3️⃣ Tu pedido salga para entrega\n' +
      '   4️⃣ Tu pedido llegue a tu dirección\n\n' +
      '⚠️ El navegador te pedirá permiso.\n' +
      'Selecciona "Permitir" para activar las notificaciones.\n\n' +
      '¿Activar notificaciones ahora?'
    );
    
    if (!shouldProceed) return;
    
    setLoading(true);
    
    try {
      // @ts-ignore
      if (typeof window.OneSignalDeferred !== 'undefined') {
        // @ts-ignore
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            // Solicitar permisos
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
              // Esperar un momento para que el navegador procese
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Obtener usuario para asociar External ID
              const { data: { user } } = await supabase.auth.getUser();
              
              if (user) {
                try {
                  await OneSignal.login(user.id);
                  console.log('✅ Notificaciones activadas y External ID asociado');
                } catch (error) {
                  console.warn('⚠️ Error asociando External ID:', error);
                }
                
                // Marcar que ya activó notificaciones
                localStorage.setItem(`notifications_asked_${user.id}`, 'yes');
              }
              
              setShowPrompt(false);
              
              // Mostrar mensaje de éxito
              alert('¡Notificaciones activadas! 🎉\nTe mantendremos informado sobre tus pedidos.');
            } else {
              alert('Necesitamos tu permiso para enviarte notificaciones sobre tus pedidos.');
            }
          } catch (error) {
            console.error('Error activando notificaciones:', error);
            alert('No se pudieron activar las notificaciones. Por favor, verifica los permisos de tu navegador.');
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5 shadow-lg">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-towny rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            📱 ¡Recibe notificaciones de tu pedido!
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Activa las notificaciones para saber cuando tu pedido sea confirmado, 
            cuando esté en camino y cuando llegue a tu dirección. ¡No te pierdas ninguna actualización!
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
              ✅ Pedido confirmado
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
              🚚 En camino
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
              🎁 Entregado
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleActivate}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-towny hover:bg-towny-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activando...
                </>
              ) : (
                <>
                  🔔 Activar ahora
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              Continuar sin notificaciones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

