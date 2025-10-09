import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

export default function SupabaseQuickTest() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const diagnostic: any = {};

    try {
      // 1. Verificar conexión básica
      console.log('🔍 Verificando conexión con Supabase...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      diagnostic.connection = {
        status: sessionError ? 'error' : 'ok',
        error: sessionError?.message,
        session: !!session
      };

      // 2. Verificar configuración de auth
      console.log('🔐 Verificando configuración de auth...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      diagnostic.auth = {
        status: userError ? 'error' : 'ok',
        error: userError?.message,
        user: !!user
      };

      // 3. Probar registro con datos mínimos
      console.log('📝 Probando registro con datos mínimos...');
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = '12345678';
      
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      diagnostic.signup = {
        status: signupError ? 'error' : 'ok',
        error: signupError?.message,
        userCreated: !!signupData?.user,
        emailConfirmed: signupData?.user?.email_confirmed_at ? 'yes' : 'no'
      };

      // 4. Verificar configuración de email
      console.log('📧 Verificando configuración de email...');
      diagnostic.email = {
        status: signupError?.message?.includes('email') ? 'error' : 'ok',
        error: signupError?.message,
        needsConfirmation: !signupData?.user?.email_confirmed_at
      };

      // 5. Verificar políticas RLS
      console.log('🔒 Verificando políticas RLS...');
      if (signupData?.user) {
        try {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: signupData.user.id,
            name: 'Test User'
          });
          
          diagnostic.rls = {
            status: profileError ? 'error' : 'ok',
            error: profileError?.message
          };
        } catch (err) {
          diagnostic.rls = {
            status: 'error',
            error: 'Error verificando RLS'
          };
        }
      }

      // 6. Verificar URL y configuración
      console.log('🌐 Verificando configuración...');
      diagnostic.config = {
        supabaseUrl: process.env.PUBLIC_SUPABASE_URL || 'No definida',
        supabaseAnonKey: process.env.PUBLIC_SUPABASE_ANON_KEY ? 'Definida' : 'No definida',
        currentUrl: window.location.origin,
        isHttps: window.location.protocol === 'https:'
      };

    } catch (err) {
      console.error('❌ Error en diagnóstico:', err);
      diagnostic.generalError = err;
    }

    setResults(diagnostic);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return '✅';
      case 'error': return '❌';
      default: return '⚠️';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🔍 Diagnóstico Rápido de Supabase
        </h2>
        <p className="text-gray-600">
          Verificando configuración para identificar el error 400
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ejecutando diagnóstico...</p>
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <div className="space-y-6">
          {/* Conexión */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">🔗</span>
              Conexión con Supabase
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="mr-2">{getStatusIcon(results.connection?.status)}</span>
                <span className={getStatusColor(results.connection?.status)}>
                  Estado: {results.connection?.status || 'unknown'}
                </span>
              </div>
              {results.connection?.error && (
                <div className="text-red-600 text-sm ml-6">
                  Error: {results.connection.error}
                </div>
              )}
            </div>
          </div>

          {/* Auth */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">🔐</span>
              Autenticación
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="mr-2">{getStatusIcon(results.auth?.status)}</span>
                <span className={getStatusColor(results.auth?.status)}>
                  Estado: {results.auth?.status || 'unknown'}
                </span>
              </div>
              {results.auth?.error && (
                <div className="text-red-600 text-sm ml-6">
                  Error: {results.auth.error}
                </div>
              )}
            </div>
          </div>

          {/* Registro */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">📝</span>
              Registro de Usuario
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="mr-2">{getStatusIcon(results.signup?.status)}</span>
                <span className={getStatusColor(results.signup?.status)}>
                  Estado: {results.signup?.status || 'unknown'}
                </span>
              </div>
              {results.signup?.error && (
                <div className="text-red-600 text-sm ml-6">
                  <strong>Error 400:</strong> {results.signup.error}
                </div>
              )}
              {results.signup?.userCreated && (
                <div className="text-green-600 text-sm ml-6">
                  ✅ Usuario creado exitosamente
                </div>
              )}
              {results.signup?.emailConfirmed && (
                <div className="text-blue-600 text-sm ml-6">
                  📧 Email confirmado: {results.signup.emailConfirmed}
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">📧</span>
              Configuración de Email
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="mr-2">{getStatusIcon(results.email?.status)}</span>
                <span className={getStatusColor(results.email?.status)}>
                  Estado: {results.email?.status || 'unknown'}
                </span>
              </div>
              {results.email?.error && (
                <div className="text-red-600 text-sm ml-6">
                  Error: {results.email.error}
                </div>
              )}
              {results.email?.needsConfirmation && (
                <div className="text-yellow-600 text-sm ml-6">
                  ⚠️ Requiere confirmación de email
                </div>
              )}
            </div>
          </div>

          {/* RLS */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">🔒</span>
              Políticas RLS
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="mr-2">{getStatusIcon(results.rls?.status)}</span>
                <span className={getStatusColor(results.rls?.status)}>
                  Estado: {results.rls?.status || 'unknown'}
                </span>
              </div>
              {results.rls?.error && (
                <div className="text-red-600 text-sm ml-6">
                  Error: {results.rls.error}
                </div>
              )}
            </div>
          </div>

          {/* Configuración */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">⚙️</span>
              Configuración
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="mr-2">🌐</span>
                <span>URL: {results.config?.supabaseUrl}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔑</span>
                <span>API Key: {results.config?.supabaseAnonKey}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                <span>Origen: {results.config?.currentUrl}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔒</span>
                <span>HTTPS: {results.config?.isHttps ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Soluciones */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Soluciones Recomendadas
            </h3>
            <div className="space-y-3 text-sm">
              {results.signup?.error && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <strong>Error 400 - Posibles causas:</strong>
                  <ul className="mt-2 ml-4 list-disc">
                    <li>Configuración de email incorrecta en Supabase</li>
                    <li>Políticas de autenticación restrictivas</li>
                    <li>URL de redirección no configurada</li>
                    <li>Configuración de SMTP faltante</li>
                  </ul>
                </div>
              )}
              
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <strong>Soluciones:</strong>
                <ol className="mt-2 ml-4 list-decimal">
                  <li>Ve a Supabase Dashboard → Authentication → Settings</li>
                  <li>Desactiva "Enable email confirmations" temporalmente</li>
                  <li>O configura SMTP en Authentication → Settings → SMTP</li>
                  <li>Verifica que la URL de redirección esté configurada</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
        </button>
      </div>
    </div>
  );
}



