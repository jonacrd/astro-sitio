import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

/**
 * Botón flotante persistente para activar notificaciones
 * Se muestra en todas las páginas si el usuario está autenticado y no tiene notificaciones
 */
export default function FloatingNotificationButton() {
  const [show, setShow] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        // Verificar si hay usuario autenticado
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser || !isMounted) {
          setShow(false);
          return;
        }

        setUser(currentUser);

        // Verificar si ya se le preguntó
        const notificationStatus = localStorage.getItem(`notifications_asked_${currentUser.id}`);
        
        // Si ya dijo que sí, no mostrar
        if (notificationStatus === 'yes') {
          setShow(false);
          return;
        }

        // Esperar a que OneSignal esté listo
        // @ts-ignore
        if (typeof window.OneSignalDeferred === 'undefined') {
          setTimeout(checkStatus, 2000);
          return;
        }

        // @ts-ignore
        window.OneSignalDeferred.push(async function(OneSignal) {
          if (!isMounted) return;

          try {
            const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
            
            if (!isPushEnabled && isMounted) {
              // No tiene notificaciones activadas, mostrar botón
              setShow(true);
            } else if (isPushEnabled && isMounted) {
              // Tiene notificaciones, ocultar botón y marcar como configurado
              setShow(false);
              localStorage.setItem(`notifications_asked_${currentUser.id}`, 'yes');
            }
          } catch (error) {
            console.error('Error checking OneSignal status:', error);
          }
        });

      } catch (error) {
        console.error('Error checking notification status:', error);
      }
    };

    // Verificar después de 3 segundos para dar tiempo a OneSignal
    const timer = setTimeout(checkStatus, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleActivate = async () => {
    // Mostrar explicación antes del prompt del navegador
    const shouldProceed = window.confirm(
      '📱 ACTIVAR NOTIFICACIONES\n\n' +
      '✅ Te avisaremos cuando:\n' +
      '   • Tu pedido sea confirmado\n' +
      '   • Tu pedido esté en preparación\n' +
      '   • Tu pedido esté en camino\n' +
      '   • Tu pedido llegue a tu dirección\n\n' +
      '⚠️ A continuación, tu navegador te pedirá permiso.\n' +
      'Por favor, selecciona "Permitir" o "Allow".\n\n' +
      '¿Continuar?'
    );
    
    if (!shouldProceed) return;
    
    setIsActivating(true);
    
    try {
      // @ts-ignore
      if (typeof window.OneSignalDeferred !== 'undefined') {
        // @ts-ignore
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            console.log('🔔 Solicitando permisos de notificación...');
            
            // Solicitar permisos
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
              console.log('✅ Permisos concedidos');
              
              // Esperar un momento para que OneSignal procese
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Asociar External ID si hay usuario
              if (user) {
                try {
                  await OneSignal.login(user.id);
                  console.log('✅ External ID asociado:', user.id);
                } catch (error) {
                  console.warn('⚠️ Error asociando External ID:', error);
                }
                
                // Marcar como configurado
                localStorage.setItem(`notifications_asked_${user.id}`, 'yes');
              }
              
              // Ocultar botón
              setShow(false);
              
              // Mostrar mensaje de éxito
              alert('¡Notificaciones activadas! 🎉\nTe avisaremos sobre tus pedidos.');
            } else if (permission === 'denied') {
              alert('❌ Permisos denegados.\n\nPara activar notificaciones:\n1. Click en el ícono de candado en la barra de direcciones\n2. Permitir notificaciones\n3. Recarga la página');
            } else {
              alert('Por favor, permite las notificaciones en tu navegador.');
            }
          } catch (error) {
            console.error('Error activando notificaciones:', error);
            alert('Error activando notificaciones. Por favor, intenta de nuevo.');
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`notifications_asked_${user.id}`, 'later');
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[9998] animate-bounce-slow">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-4 max-w-xs">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm mb-1">
              📦 Sigue tu pedido en tiempo real
            </h3>
            <p className="text-white/90 text-xs mb-3">
              Te avisaremos cuando esté confirmado, en camino y al llegar
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleActivate}
                disabled={isActivating}
                className="flex-1 bg-white text-blue-600 font-semibold text-xs py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {isActivating ? 'Activando...' : 'Activar'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isActivating}
                className="flex-shrink-0 bg-white/20 text-white text-xs py-2 px-3 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                Después
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

