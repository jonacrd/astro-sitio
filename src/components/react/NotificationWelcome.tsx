import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

/**
 * Modal de bienvenida para activar notificaciones después del registro
 */
export default function NotificationWelcome() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAndShowModal = async () => {
      try {
        // Verificar si el usuario acaba de registrarse
        const justRegistered = localStorage.getItem('just_registered');
        
        if (!justRegistered) return;

        // Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !isMounted) return;

        // Verificar si ya activó notificaciones antes
        const notificationStatus = localStorage.getItem(`notifications_asked_${user.id}`);
        
        if (notificationStatus) {
          // Ya se le preguntó antes
          localStorage.removeItem('just_registered');
          return;
        }

        // Esperar a que OneSignal esté listo
        // @ts-ignore
        if (typeof window.OneSignalDeferred === 'undefined') {
          setTimeout(checkAndShowModal, 1000);
          return;
        }

        // @ts-ignore
        window.OneSignalDeferred.push(async function(OneSignal) {
          if (!isMounted) return;

          const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
          
          if (!isPushEnabled) {
            // No tiene notificaciones activadas, mostrar modal
            setShowModal(true);
          }
          
          // Limpiar flag de registro
          localStorage.removeItem('just_registered');
        });

      } catch (error) {
        console.error('Error verificando notificaciones:', error);
      }
    };

    // Verificar después de 2 segundos para que se cargue todo
    const timer = setTimeout(checkAndShowModal, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleActivate = async () => {
    setLoading(true);
    
    try {
      // @ts-ignore
      if (typeof window.OneSignalDeferred !== 'undefined') {
        // @ts-ignore
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            // Solicitar permisos
            await Notification.requestPermission();
            
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
              
              // Marcar que ya se le preguntó
              localStorage.setItem(`notifications_asked_${user.id}`, 'yes');
            }
            
            setShowModal(false);
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

  const handleMaybeLater = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Marcar que se le preguntó pero rechazó
      localStorage.setItem(`notifications_asked_${user.id}`, 'later');
    }
    
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Bienvenido a Town! 🎉</h2>
          <p className="text-blue-100 text-sm">
            Activa las notificaciones para estar al tanto de tus pedidos
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pedidos confirmados</h3>
                <p className="text-sm text-gray-600">Sabrás cuando tu pedido sea confirmado</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pedidos en camino</h3>
                <p className="text-sm text-gray-600">Te avisaremos cuando tu pedido esté en tránsito</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Ofertas especiales</h3>
                <p className="text-sm text-gray-600">Entérate primero de promociones y descuentos</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activando...
                </span>
              ) : (
                '🔔 Activar Notificaciones'
              )}
            </button>

            <button
              onClick={handleMaybeLater}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              Tal vez después
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Puedes cambiar esto en cualquier momento desde tu perfil
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

