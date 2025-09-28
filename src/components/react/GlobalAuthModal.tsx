import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface GlobalAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
}

export default function GlobalAuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: GlobalAuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escuchar mensajes para cambiar modo
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SET_REGISTER_MODE') {
        setIsLogin(false);
        resetForm();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error de login:', error);
        
        // Mensajes de error más específicos
        if (error.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos. Verifica tus datos.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Tu email no está confirmado. Revisa tu bandeja de entrada.');
        } else if (error.message.includes('Too many requests')) {
          setError('Demasiados intentos. Espera unos minutos e intenta nuevamente.');
        } else {
          setError(`Error de inicio de sesión: ${error.message}`);
        }
        return;
      }

      console.log('✅ Login exitoso:', data.user?.email);
      
      // Disparar evento global para actualizar UI
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: data.user, type: 'login' } 
      }));
      
      // Notificar éxito y cerrar modal
      onSuccess?.();
      onClose();
      
      // Redirigir al feed principal
      setTimeout(() => {
        window.location.href = '/';
      }, 500);

    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setError('Error inesperado. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error de registro:', error);
        
        // Mensajes de error más específicos
        if (error.message.includes('User already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.');
        } else if (error.message.includes('Password should be at least')) {
          setError('La contraseña debe tener al menos 6 caracteres.');
        } else if (error.message.includes('Invalid email')) {
          setError('El email no es válido.');
        } else {
          setError(`Error de registro: ${error.message}`);
        }
        return;
      }

      console.log('✅ Registro exitoso:', data.user?.email);
      
      // Disparar evento global para actualizar UI
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: data.user, type: 'register' } 
      }));
      
      // Notificar éxito y cerrar modal
      onSuccess?.();
      onClose();
      
      // Redirigir al feed principal
      setTimeout(() => {
        window.location.href = '/';
      }, 500);

    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setError('Error inesperado. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="text-sm text-gray-500">
              {isLogin ? 'Accede a tu cuenta' : 'Crea tu cuenta de vendedor'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="p-4 space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 bg-white"
              placeholder="tu@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 bg-white"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {/* Confirm Password (solo en registro) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 bg-white"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              {isLogin 
                ? '¿No tienes cuenta? Crear cuenta' 
                : '¿Ya tienes cuenta? Iniciar sesión'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
