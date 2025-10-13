import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

export default function PushDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      browser: {},
      permissions: {},
      serviceWorker: {},
      subscription: {},
      database: {},
      user: {}
    };

    try {
      // 1. Información del navegador
      results.browser = {
        userAgent: navigator.userAgent,
        isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        supportsServiceWorker: 'serviceWorker' in navigator,
        supportsPushManager: 'PushManager' in window,
        supportsNotifications: 'Notification' in window
      };

      // 2. Permisos de notificaciones
      if ('Notification' in window) {
        results.permissions.notification = Notification.permission;
      }

      // 3. Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          results.serviceWorker.registered = !!registration;
          if (registration) {
            results.serviceWorker.scope = registration.scope;
            results.serviceWorker.active = !!registration.active;
            
            // 4. Suscripción push
            if (registration.pushManager) {
              const subscription = await registration.pushManager.getSubscription();
              results.subscription.exists = !!subscription;
              if (subscription) {
                results.subscription.endpoint = subscription.endpoint;
                results.subscription.keys = {
                  p256dh: !!subscription.getKey('p256dh'),
                  auth: !!subscription.getKey('auth')
                };
              }
            }
          }
        } catch (err: any) {
          results.serviceWorker.error = err.message;
        }
      }

      // 5. Usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      results.user.authenticated = !!user;
      if (user) {
        results.user.id = user.id;
        results.user.email = user.email;
        
        // 6. Suscripción en base de datos
        const { data: dbSubscription, error: dbError } = await supabase
          .from('push_subscriptions')
          .select('id, user_id, endpoint, created_at')
          .eq('user_id', user.id)
          .maybeSingle();
        
        results.database.hasSubscription = !!dbSubscription;
        if (dbError) {
          results.database.error = dbError.message;
          console.error('Error consultando BD:', dbError);
        }
        if (dbSubscription) {
          results.database.subscriptionId = dbSubscription.id;
          results.database.createdAt = dbSubscription.created_at;
          results.database.endpoint = dbSubscription.endpoint?.substring(0, 50) + '...';
        }
      }

    } catch (err: any) {
      results.error = err.message;
    }

    setDiagnosticResults(results);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-towny-light text-white p-4 rounded-lg shadow-lg max-w-md z-50">
        <p className="text-sm">🔍 Diagnosticando notificaciones push...</p>
      </div>
    );
  }

  if (!diagnosticResults) return null;

  const hasIssues = 
    diagnosticResults.browser.isIOS ||
    !diagnosticResults.browser.supportsServiceWorker ||
    !diagnosticResults.browser.supportsPushManager ||
    diagnosticResults.permissions.notification !== 'granted' ||
    !diagnosticResults.serviceWorker.registered ||
    !diagnosticResults.subscription.exists ||
    (diagnosticResults.user.authenticated && !diagnosticResults.database.hasSubscription);

  return (
    <div className="fixed bottom-4 right-4 bg-white text-gray-900 p-6 rounded-lg shadow-2xl max-w-md z-50 max-h-[80vh] overflow-y-auto border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          {hasIssues ? '⚠️' : '✅'} Diagnóstico Push
        </h3>
        <button
          onClick={() => setDiagnosticResults(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Navegador */}
        <div>
          <p className="font-semibold mb-1">📱 Navegador:</p>
          <ul className="space-y-1 ml-4">
            <li className={diagnosticResults.browser.isIOS ? 'text-red-600' : 'text-green-600'}>
              {diagnosticResults.browser.isIOS ? '❌' : '✅'} iOS: {diagnosticResults.browser.isIOS ? 'SÍ (LIMITADO)' : 'No'}
            </li>
            <li className={diagnosticResults.browser.isSafari ? 'text-yellow-600' : 'text-green-600'}>
              {diagnosticResults.browser.isSafari ? '⚠️' : '✅'} Safari: {diagnosticResults.browser.isSafari ? 'Sí' : 'No'}
            </li>
            <li className={diagnosticResults.browser.supportsServiceWorker ? 'text-green-600' : 'text-red-600'}>
              {diagnosticResults.browser.supportsServiceWorker ? '✅' : '❌'} Service Worker
            </li>
            <li className={diagnosticResults.browser.supportsPushManager ? 'text-green-600' : 'text-red-600'}>
              {diagnosticResults.browser.supportsPushManager ? '✅' : '❌'} Push Manager
            </li>
            <li className={diagnosticResults.browser.supportsNotifications ? 'text-green-600' : 'text-red-600'}>
              {diagnosticResults.browser.supportsNotifications ? '✅' : '❌'} Notifications API
            </li>
          </ul>
        </div>

        {/* Permisos */}
        <div>
          <p className="font-semibold mb-1">🔐 Permisos:</p>
          <ul className="space-y-1 ml-4">
            <li className={diagnosticResults.permissions.notification === 'granted' ? 'text-green-600' : 'text-red-600'}>
              {diagnosticResults.permissions.notification === 'granted' ? '✅' : '❌'} Notificaciones: {diagnosticResults.permissions.notification}
            </li>
          </ul>
        </div>

        {/* Service Worker */}
        <div>
          <p className="font-semibold mb-1">⚙️ Service Worker:</p>
          <ul className="space-y-1 ml-4">
            <li className={diagnosticResults.serviceWorker.registered ? 'text-green-600' : 'text-red-600'}>
              {diagnosticResults.serviceWorker.registered ? '✅' : '❌'} Registrado: {diagnosticResults.serviceWorker.registered ? 'Sí' : 'No'}
            </li>
            {diagnosticResults.serviceWorker.active !== undefined && (
              <li className={diagnosticResults.serviceWorker.active ? 'text-green-600' : 'text-red-600'}>
                {diagnosticResults.serviceWorker.active ? '✅' : '❌'} Activo: {diagnosticResults.serviceWorker.active ? 'Sí' : 'No'}
              </li>
            )}
            {diagnosticResults.serviceWorker.error && (
              <li className="text-red-600">❌ Error: {diagnosticResults.serviceWorker.error}</li>
            )}
          </ul>
        </div>

        {/* Suscripción */}
        <div>
          <p className="font-semibold mb-1">📬 Suscripción Push:</p>
          <ul className="space-y-1 ml-4">
            <li className={diagnosticResults.subscription.exists ? 'text-green-600' : 'text-red-600'}>
              {diagnosticResults.subscription.exists ? '✅' : '❌'} Suscrito: {diagnosticResults.subscription.exists ? 'Sí' : 'No'}
            </li>
            {diagnosticResults.subscription.endpoint && (
              <li className="text-xs text-gray-600 break-all">
                Endpoint: {diagnosticResults.subscription.endpoint.substring(0, 50)}...
              </li>
            )}
          </ul>
        </div>

        {/* Usuario */}
        <div>
          <p className="font-semibold mb-1">👤 Usuario:</p>
          <ul className="space-y-1 ml-4">
            <li className={diagnosticResults.user.authenticated ? 'text-green-600' : 'text-yellow-600'}>
              {diagnosticResults.user.authenticated ? '✅' : '⚠️'} Autenticado: {diagnosticResults.user.authenticated ? 'Sí' : 'No'}
            </li>
            {diagnosticResults.user.email && (
              <li className="text-xs text-gray-600">{diagnosticResults.user.email}</li>
            )}
          </ul>
        </div>

        {/* Base de datos */}
        {diagnosticResults.user.authenticated && (
          <div>
            <p className="font-semibold mb-1">💾 Base de Datos:</p>
            <ul className="space-y-1 ml-4">
              <li className={diagnosticResults.database.hasSubscription ? 'text-green-600' : 'text-red-600'}>
                {diagnosticResults.database.hasSubscription ? '✅' : '❌'} Suscripción guardada: {diagnosticResults.database.hasSubscription ? 'Sí' : 'No'}
              </li>
              {diagnosticResults.database.error && (
                <li className="text-red-600 text-xs">❌ {diagnosticResults.database.error}</li>
              )}
            </ul>
          </div>
        )}

        {/* Recomendaciones */}
        {hasIssues && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="font-semibold mb-2 text-yellow-800">⚠️ Problemas detectados:</p>
            <ul className="space-y-1 text-xs text-yellow-700">
              {diagnosticResults.browser.isIOS && (
                <li>• iOS tiene soporte limitado para notificaciones push en PWA</li>
              )}
              {!diagnosticResults.browser.supportsServiceWorker && (
                <li>• Tu navegador no soporta Service Workers</li>
              )}
              {diagnosticResults.permissions.notification !== 'granted' && (
                <li>• Necesitas otorgar permisos de notificaciones</li>
              )}
              {!diagnosticResults.serviceWorker.registered && (
                <li>• El Service Worker no está registrado</li>
              )}
              {!diagnosticResults.subscription.exists && (
                <li>• No hay suscripción push activa</li>
              )}
              {diagnosticResults.user.authenticated && !diagnosticResults.database.hasSubscription && (
                <li>• La suscripción no está guardada en la base de datos</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={runDiagnostic}
        className="mt-4 w-full bg-towny-light text-white py-2 rounded-lg hover:bg-towny transition-colors"
      >
        🔄 Volver a diagnosticar
      </button>
    </div>
  );
}

