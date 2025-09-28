import React, { useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
}

export default function LoginModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Intentando autenticación...', { isLogin, email });
      
      if (isLogin) {
        // Iniciar sesión
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        console.log('📝 Resultado de login:', { data: !!data, error });

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

        if (data.user) {
          console.log('✅ Login exitoso:', data.user.email);
          // Éxito
          onSuccess?.();
          if (onClose) {
            onClose();
          }
        }
      } else {
        // Registro
        console.log('🔄 Intentando registro...', { email, name });
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              phone: phone.trim(),
              is_seller: false
            }
          }
        });

        console.log('📝 Resultado de registro:', { data: !!data, error });

        if (error) {
          console.error('❌ Error de registro:', error);
          
          // Mensajes de error más específicos
          if (error.message.includes('User already registered')) {
            setError('Este email ya está registrado. Intenta iniciar sesión.');
          } else if (error.message.includes('Password should be at least')) {
            setError('La contraseña debe tener al menos 6 caracteres.');
          } else if (error.message.includes('Invalid email')) {
            setError('Por favor ingresa un email válido.');
          } else {
            setError(`Error de registro: ${error.message}`);
          }
          return;
        }

        if (data.user) {
          console.log('✅ Registro exitoso:', data.user.email);
          
          if (!data.user.email_confirmed_at) {
            setError('Revisa tu email para confirmar tu cuenta antes de iniciar sesión.');
            return;
          }

          // Éxito
          onSuccess?.();
          if (onClose) {
            onClose();
          }
        }
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setError('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  // Escuchar mensajes para cambiar modo
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SET_REGISTER_MODE') {
        setIsLogin(false);
        resetForm();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin 
              ? 'Ingresa a tu cuenta para continuar' 
              : 'Únete a nuestra comunidad'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* Campos adicionales para registro */}
          {!isLogin && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 bg-white"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 bg-white"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botón submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
              </div>
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Toggle entre login y registro */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {isLogin 
              ? '¿No tienes cuenta? Crear cuenta' 
              : '¿Ya tienes cuenta? Iniciar sesión'
            }
          </button>
        </div>

        {/* Cerrar modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
