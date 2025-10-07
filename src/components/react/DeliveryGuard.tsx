import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface DeliveryGuardProps {
  children: React.ReactNode;
}

export default function DeliveryGuard({ children }: DeliveryGuardProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error verificando sesión:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        // Verificar si el usuario es un courier
        const { data: courier, error: courierError } = await supabase
          .from('couriers')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (courierError || !courier) {
          console.log('Usuario no es courier, redirigiendo...');
          window.location.href = '/delivery';
          return;
        }

        setUser(courier);
        setAuthenticated(true);
      } else {
        console.log('No hay sesión activa, redirigiendo...');
        window.location.href = '/delivery';
      }
    } catch (error) {
      console.error('Error en checkAuth:', error);
      window.location.href = '/delivery';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div class="min-h-screen bg-gray-900 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p class="text-gray-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div class="min-h-screen bg-gray-900 flex items-center justify-center">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p class="text-gray-400 mb-4">No tienes permisos de repartidor</p>
          <a 
            href="/delivery" 
            class="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Volver al Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
