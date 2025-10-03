import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Componente para suscribir automáticamente a usuarios autenticados
 * con OneSignal usando su user_id de Supabase
 */
export default function OneSignalSubscriber() {
  useEffect(() => {
    let isMounted = true;

    const subscribeUser = async () => {
      try {
        // Esperar a que OneSignal esté listo usando OneSignalDeferred
        // @ts-ignore
        if (typeof window.OneSignalDeferred === 'undefined') {
          console.log('⏳ OneSignal SDK no cargado, reintentando...');
          setTimeout(subscribeUser, 1000);
          return;
        }

        // @ts-ignore
        window.OneSignalDeferred.push(async function(OneSignal) {
          if (!isMounted) return;

          try {
            // Obtener usuario autenticado
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user || !isMounted) return;

            console.log('👤 Usuario autenticado, configurando OneSignal...');

            // Configurar el external_user_id con el UUID de Supabase
            await OneSignal.login(user.id);
            
            console.log('✅ Usuario suscrito a OneSignal con ID:', user.id);

            // Verificar estado de la suscripción
            const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
            
            if (isPushEnabled) {
              console.log('🔔 Notificaciones push activadas');
            } else {
              console.log('⚠️ Notificaciones push no activadas. Click en el botón azul para activar.');
            }
          } catch (error) {
            console.error('❌ Error configurando OneSignal:', error);
          }
        });

      } catch (error) {
        console.error('❌ Error en subscribeUser:', error);
      }
    };

    // Intentar suscribir al cargar
    subscribeUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && isMounted) {
        console.log('🔐 Usuario inició sesión, suscribiendo a OneSignal...');
        setTimeout(subscribeUser, 1000); // Esperar 1 segundo para que OneSignal esté listo
      } else if (event === 'SIGNED_OUT' && isMounted) {
        try {
          // @ts-ignore
          if (typeof OneSignal !== 'undefined') {
            // @ts-ignore
            await OneSignal.logout();
            console.log('👋 Usuario desuscrito de OneSignal');
          }
        } catch (error) {
          console.error('Error al desuscribir de OneSignal:', error);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Este componente no renderiza nada
  return null;
}

