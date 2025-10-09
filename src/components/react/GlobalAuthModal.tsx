import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getSupabase, isSupabaseAvailable } from '../../lib/supabase-config';

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) {
        setError('Error de configuración. Intenta recargar la página.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('❌ Error con Google:', error);
        setError(`Error con Google: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Google sign in iniciado:', data);
      // El usuario será redirigido a Google y luego de vuelta a la app
      
    } catch (error) {
      console.error('❌ Error inesperado con Google:', error);
      setError('Error inesperado con Google. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) {
        setError('Error de configuración. Intenta recargar la página.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
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
      console.log('📢 Disparando evento auth-state-changed...');
      const authEvent = new CustomEvent('auth-state-changed', { 
        detail: { user: data.user, type: 'login' } 
      });
      window.dispatchEvent(authEvent);
      console.log('📢 Evento auth-state-changed disparado');
      
      // Notificar éxito y cerrar modal
      onSuccess?.();
      onClose();
      
      // No redirigir automáticamente, dejar que el usuario decida
      console.log('✅ Login exitoso, modal cerrado');

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
      const supabaseClient = getSupabase();
      if (!supabaseClient) {
        setError('Error de configuración. Intenta recargar la página.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient.auth.signUp({
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
      
      // No redirigir automáticamente, dejar que el usuario decida
      console.log('✅ Login exitoso, modal cerrado');

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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-3 text-gray-700 hover:text-gray-900"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700">{isLogin ? 'Iniciar sesión con Google' : 'Registrarse con Google'}</span>
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
