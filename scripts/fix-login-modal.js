#!/usr/bin/env node

/**
 * Script para arreglar el modal de login que no se cierra y no muestra notificaciones
 */

import fs from 'fs';
import path from 'path';

function fixLoginModal() {
  console.log('🔧 Arreglando el modal de login que no se cierra...\n');
  
  try {
    // 1. Verificar que el modal de login existe
    console.log('🔧 Verificando modal de login...');
    const modalFiles = [
      'src/components/react/LoginModal.tsx',
      'src/components/react/GlobalAuthModal.tsx',
      'src/components/react/AuthContext.tsx'
    ];
    
    modalFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} existe`);
      } else {
        console.log(`❌ ${file} no existe`);
      }
    });

    // 2. Crear modal de login corregido
    console.log('\n🔧 Creando modal de login corregido...');
    const fixedLoginModal = `import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: any) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Resetear estado cuando se abre el modal
      setEmail('');
      setPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('🔐 Iniciando sesión...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error en login:', error.message);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('✅ Login exitoso:', data.user.email);
        setSuccess(true);
        
        // Mostrar notificación de éxito
        if (typeof window !== 'undefined') {
          // Crear notificación personalizada
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
          notification.innerHTML = \`
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              ¡Inicio de sesión exitoso!
            </div>
          \`;
          
          document.body.appendChild(notification);
          
          // Animar la notificación
          setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
          }, 100);
          
          // Remover la notificación después de 3 segundos
          setTimeout(() => {
            notification.classList.remove('translate-x-0');
            notification.classList.add('translate-x-full');
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }, 3000);
        }

        // Cerrar el modal después de un breve delay
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }
          
          // Disparar evento personalizado para actualizar la UI
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-state-changed', {
              detail: { user: data.user, type: 'login' }
            }));
          }
        }, 1500);

      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('📝 Registrando usuario...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error en registro:', error.message);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('✅ Registro exitoso:', data.user.email);
        setSuccess(true);
        
        // Mostrar notificación de éxito
        if (typeof window !== 'undefined') {
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
          notification.innerHTML = \`
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              ¡Registro exitoso! Revisa tu email para confirmar.
            </div>
          \`;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
          }, 100);
          
          setTimeout(() => {
            notification.classList.remove('translate-x-0');
            notification.classList.add('translate-x-full');
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }, 3000);
        }

        // Cerrar el modal después de un breve delay
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-state-changed', {
              detail: { user: data.user, type: 'register' }
            }));
          }
        }, 1500);

      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setError('Error inesperado al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Iniciar Sesión</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ¡Operación exitosa!
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
            
            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}`;

    // Guardar modal de login corregido
    const modalPath = path.join(process.cwd(), 'src/components/react/FixedLoginModal.tsx');
    fs.writeFileSync(modalPath, fixedLoginModal);
    console.log('✅ Modal de login corregido creado: FixedLoginModal.tsx');

    // 3. Crear hook de autenticación corregido
    console.log('\n🔧 Creando hook de autenticación corregido...');
    const fixedAuthHook = `import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-browser';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error obteniendo sesión inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Estado de autenticación cambiado:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);

        // Disparar evento personalizado
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: { user: session?.user, type: event }
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}`;

    // Guardar hook de autenticación corregido
    const hookPath = path.join(process.cwd(), 'src/hooks/useAuth.ts');
    fs.writeFileSync(hookPath, fixedAuthHook);
    console.log('✅ Hook de autenticación corregido creado: useAuth.ts');

    // 4. Crear componente de notificaciones
    console.log('\n🔧 Creando componente de notificaciones...');
    const notificationComponent = `import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      const { user, type } = event.detail;
      
      if (type === 'login' && user) {
        addNotification({
          type: 'success',
          message: \`¡Bienvenido, \${user.email}!\`
        });
      } else if (type === 'logout') {
        addNotification({
          type: 'info',
          message: 'Sesión cerrada correctamente'
        });
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    };
  }, []);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={\`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 \${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }\`}
        >
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}`;

    // Guardar componente de notificaciones
    const notificationPath = path.join(process.cwd(), 'src/components/react/NotificationSystem.tsx');
    fs.writeFileSync(notificationPath, notificationComponent);
    console.log('✅ Componente de notificaciones creado: NotificationSystem.tsx');

    // 5. Resumen
    console.log('\n📊 RESUMEN DE LA CORRECCIÓN:');
    console.log('✅ Modal de login corregido: CREADO');
    console.log('✅ Hook de autenticación corregido: CREADO');
    console.log('✅ Sistema de notificaciones: CREADO');
    console.log('✅ Cierre automático del modal: IMPLEMENTADO');
    console.log('✅ Notificaciones de éxito: IMPLEMENTADAS');

    console.log('\n🎯 CARACTERÍSTICAS DE LA CORRECCIÓN:');
    console.log('1. ✅ CIERRE AUTOMÁTICO: El modal se cierra después del login exitoso');
    console.log('2. ✅ NOTIFICACIONES: Muestra notificaciones de éxito');
    console.log('3. ✅ ESTADO RESET: Resetea el estado cuando se abre el modal');
    console.log('4. ✅ EVENTOS PERSONALIZADOS: Dispara eventos para actualizar la UI');
    console.log('5. ✅ MANEJO DE ERRORES: Muestra errores claramente');
    console.log('6. ✅ LOADING STATES: Estados de carga apropiados');

    console.log('\n🚀 INSTRUCCIONES PARA IMPLEMENTAR:');
    console.log('1. ✅ REEMPLAZAR LoginModal por FixedLoginModal');
    console.log('2. ✅ AGREGAR NotificationSystem al layout');
    console.log('3. ✅ USAR useAuth hook corregido');
    console.log('4. ✅ ACTUALIZAR componentes que usan el modal');
    console.log('5. ✅ REINICIAR EL SERVIDOR DE DESARROLLO');

    console.log('\n🎉 ¡MODAL DE LOGIN CORREGIDO!');
    console.log('✅ Se cierra automáticamente después del login');
    console.log('✅ Muestra notificaciones de éxito');
    console.log('✅ Maneja errores correctamente');
    console.log('✅ Actualiza la UI automáticamente');

  } catch (error) {
    console.error('❌ Error en la corrección:', error);
  }
}

fixLoginModal();



