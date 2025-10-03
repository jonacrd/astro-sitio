import React, { useState, useEffect } from 'react';
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
      
      // Prevenir scroll del body
      document.body.classList.add('modal-open');
    } else {
      // Restaurar scroll del body
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('modal-open');
    };
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
          notification.innerHTML = `
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              ¡Inicio de sesión exitoso!
            </div>
          `;
          
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
          notification.innerHTML = `
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              ¡Registro exitoso! Revisa tu email para confirmar.
            </div>
          `;
          
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

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        width: '100vw',
        height: '100vh'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '28rem',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">🔐 Iniciar Sesión</h2>
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
}