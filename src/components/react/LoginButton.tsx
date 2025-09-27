import React, { useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface LoginButtonProps {
  onLoginSuccess: () => void;
}

export default function LoginButton({ onLoginSuccess }: LoginButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
      onLoginSuccess();
      setShowModal(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón de Login */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
        title="Iniciar sesión"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <span className="text-sm font-medium hidden sm:inline">Login</span>
      </button>

      {/* Modal de Login/Registro */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in" 
          style={{ minHeight: '100vh' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-surface/90 backdrop-blur-sm rounded-xl p-6 w-full max-w-md mx-auto my-8 shadow-2xl border border-white/10 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              </p>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-accent font-medium hover:text-accent/80 transition-colors"
              >
                {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
              </button>
            </div>

            {/* Opciones de tipo de usuario */}
            {!isLogin && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-white/60 text-sm mb-3">¿Qué tipo de usuario eres?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center hover:bg-blue-500/30 transition-colors"
                  >
                    <div className="text-2xl mb-1">🛒</div>
                    <p className="text-white font-medium text-sm">Comprador</p>
                    <p className="text-white/60 text-xs">Comprar productos</p>
                  </button>
                  <button
                    type="button"
                    className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center hover:bg-green-500/30 transition-colors"
                  >
                    <div className="text-2xl mb-1">🏪</div>
                    <p className="text-white font-medium text-sm">Vendedor</p>
                    <p className="text-white/60 text-xs">Vender productos</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
