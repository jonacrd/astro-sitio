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
        // Verificar que OneSignal esté cargado
        // @ts-ignore
        if (typeof OneSignal === 'undefined') {
          console.log('⏳ Esperando a que OneSignal se cargue...');
          setTimeout(subscribeUser, 1000);
          return;
        }

        // Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !isMounted) return;

        console.log('👤 Usuario autenticado, configurando OneSignal...');

        // Configurar el external_user_id con el UUID de Supabase
        // @ts-ignore
        await OneSignal.login(user.id);
        
        console.log('✅ Usuario suscrito a OneSignal con ID:', user.id);

        // Verificar estado de la suscripción
        // @ts-ignore
        const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
        
        if (isPushEnabled) {
          console.log('🔔 Notificaciones push activadas');
        } else {
          console.log('⚠️ Notificaciones push no activadas, mostrando prompt...');
          
          // Mostrar el prompt de notificaciones automáticamente
          // @ts-ignore
          await OneSignal.Slidedown.promptPush();
        }

      } catch (error) {
        console.error('❌ Error configurando OneSignal:', error);
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

