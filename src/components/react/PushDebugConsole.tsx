import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PushDebugConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [isVendor, setIsVendor] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
    console.log(message);
  };

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        addLog(`👤 Usuario ID: ${user.id}`);

        // Verificar si es vendedor
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setIsVendor(profile.role === 'seller');
          addLog(`👔 Rol: ${profile.role}`);
        }
      } else {
        addLog('❌ No hay usuario autenticado');
      }
    } catch (error: any) {
      addLog(`❌ Error verificando usuario: ${error.message}`);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addLog('❌ No hay usuario autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        addLog(`❌ Error consultando suscripciones: ${error.message}`);
      } else if (data && data.length > 0) {
        addLog(`✅ Suscripción encontrada:`);
        addLog(`   📍 Endpoint: ${data[0].endpoint.substring(0, 50)}...`);
        addLog(`   📅 Creada: ${data[0].created_at}`);
      } else {
        addLog('⚠️ No hay suscripción guardada en la BD');
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const checkPermissions = async () => {
    if (!('Notification' in window)) {
      addLog('❌ Las notificaciones no están soportadas');
      return;
    }

    addLog(`🔔 Permiso de notificaciones: ${Notification.permission}`);

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          addLog('✅ Service Worker registrado');
          
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            addLog('✅ Suscripción push activa en el navegador');
            addLog(`   📍 Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          } else {
            addLog('⚠️ No hay suscripción push en el navegador');
          }
        } else {
          addLog('❌ Service Worker NO registrado');
        }
      } catch (error: any) {
        addLog(`❌ Error verificando SW: ${error.message}`);
      }
    }
  };

  const testNotification = async () => {
    try {
      addLog('🧪 Enviando notificación de prueba...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addLog('❌ No hay usuario autenticado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: '🧪 Prueba de Notificación',
          body: `Prueba enviada a las ${new Date().toLocaleTimeString()}`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'test-notification'
        }
      });

      if (error) {
        addLog(`❌ Error en Edge Function: ${error.message}`);
      } else {
        addLog('✅ Edge Function ejecutado:');
        addLog(`   📊 Resultado: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const testVendorNotification = async () => {
    const vendorId = prompt('Ingresa el user_id del vendedor:');
    if (!vendorId) return;

    try {
      addLog(`🧪 Enviando notificación al vendedor ${vendorId}...`);

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: vendorId,
          title: '🛒 ¡Nuevo Pedido Recibido!',
          body: 'Tienes un nuevo pedido de prueba',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'test-order'
        }
      });

      if (error) {
        addLog(`❌ Error: ${error.message}`);
      } else {
        addLog('✅ Notificación enviada:');
        addLog(`   📊 ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const checkAllSubscriptions = async () => {
    try {
      addLog('🔍 Consultando TODAS las suscripciones...');
      
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        addLog(`❌ Error: ${error.message}`);
      } else if (data && data.length > 0) {
        addLog(`✅ ${data.length} suscripciones encontradas:`);
        data.forEach((sub, i) => {
          addLog(`   ${i + 1}. User: ${sub.user_id.substring(0, 8)}... | ${sub.created_at}`);
        });
      } else {
        addLog('⚠️ No hay suscripciones en la base de datos');
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed top-20 right-4 w-96 bg-white rounded-lg shadow-2xl p-4 z-[9999] max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🔍 Push Debug Console</h3>
        <button 
          onClick={() => setLogs([])}
          className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Limpiar
        </button>
      </div>

      {userId && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <p className="font-mono">User: {userId.substring(0, 16)}...</p>
          <p className="text-gray-600">Rol: {isVendor ? '🏪 Vendedor' : '🛒 Comprador'}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={checkPermissions}
          className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          🔔 Permisos
        </button>
        <button
          onClick={checkSubscription}
          className="px-3 py-2 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          📊 Mi Sub
        </button>
        <button
          onClick={testNotification}
          className="px-3 py-2 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          🧪 Test Yo
        </button>
        <button
          onClick={testVendorNotification}
          className="px-3 py-2 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
        >
          🏪 Test Vendedor
        </button>
        <button
          onClick={checkAllSubscriptions}
          className="px-3 py-2 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 col-span-2"
        >
          📋 Todas las Subs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-gray-500">Esperando logs...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1 leading-tight">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


