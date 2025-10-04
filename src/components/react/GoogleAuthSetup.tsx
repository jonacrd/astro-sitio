import React, { useState } from 'react';

export default function GoogleAuthSetup() {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "1. Google Cloud Console",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Crea un nuevo proyecto o selecciona uno existente</li>
            <li>Ve a "APIs & Services" → "Library"</li>
            <li>Busca "Google+ API" y habilítala</li>
            <li>Ve a "APIs & Services" → "Credentials"</li>
            <li>Haz clic en "Create Credentials" → "OAuth client ID"</li>
            <li>Selecciona "Web application"</li>
            <li><strong>Nombre:</strong> "Town App"</li>
            <li><strong>Authorized redirect URIs:</strong></li>
          </ol>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            https://tu-proyecto.supabase.co/auth/v1/callback
          </div>
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Reemplaza "tu-proyecto" con tu ID de proyecto de Supabase
            </p>
          </div>
        </div>
      )
    },
    {
      title: "2. Obtener Credenciales",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Después de crear el OAuth client, obtendrás:
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Client ID</p>
              <p className="text-sm text-blue-600 font-mono">
                Ejemplo: 123456789-abcdefg.apps.googleusercontent.com
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-sm font-medium text-green-800">Client Secret</p>
              <p className="text-sm text-green-600 font-mono">
                Ejemplo: GOCSPX-abcdefghijklmnop
              </p>
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Importante:</strong> Guarda estas credenciales de forma segura
            </p>
          </div>
        </div>
      )
    },
    {
      title: "3. Configurar Supabase",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Ve a tu <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a>
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Selecciona tu proyecto</li>
            <li>Ve a "Authentication" → "Providers"</li>
            <li>Habilita "Google provider"</li>
            <li>Pega tu <strong>Client ID</strong> de Google</li>
            <li>Pega tu <strong>Client Secret</strong> de Google</li>
            <li>El <strong>Redirect URL</strong> se genera automáticamente</li>
            <li>Guarda los cambios</li>
          </ol>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-sm text-green-800">
              <strong>✅ Listo:</strong> Una vez configurado, el botón de Google funcionará automáticamente
            </p>
          </div>
        </div>
      )
    },
    {
      title: "4. Probar la Integración",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Una vez configurado todo:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Abre tu aplicación</li>
            <li>Haz clic en "Iniciar Sesión" o "Registrarse"</li>
            <li>Haz clic en "Continuar con Google"</li>
            <li>Se abrirá la ventana de Google</li>
            <li>Autoriza la aplicación</li>
            <li>Serás redirigido de vuelta a tu app</li>
          </ol>
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> El usuario se creará automáticamente en Supabase con la información de Google
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🔐 Configuración de Autenticación con Google
        </h2>
        <p className="text-gray-600">
          Guía paso a paso para implementar login con Google en tu aplicación
        </p>
      </div>

      {/* Navegación de pasos */}
      <div className="mb-8">
        <div className="flex space-x-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setStep(index + 1)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === index + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Paso {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {steps[step - 1].title}
        </h3>
        {steps[step - 1].content}
      </div>

      {/* Navegación */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        
        <button
          onClick={() => setStep(Math.min(steps.length, step + 1))}
          disabled={step === steps.length}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">📋 Checklist de Configuración</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <span className="mr-2">☐</span>
            Proyecto creado en Google Cloud Console
          </li>
          <li className="flex items-center">
            <span className="mr-2">☐</span>
            Google+ API habilitada
          </li>
          <li className="flex items-center">
            <span className="mr-2">☐</span>
            OAuth client ID creado
          </li>
          <li className="flex items-center">
            <span className="mr-2">☐</span>
            Redirect URI configurado correctamente
          </li>
          <li className="flex items-center">
            <span className="mr-2">☐</span>
            Google provider habilitado en Supabase
          </li>
          <li className="flex items-center">
            <span className="mr-2">☐</span>
            Credenciales configuradas en Supabase
          </li>
        </ul>
      </div>
    </div>
  );
}

