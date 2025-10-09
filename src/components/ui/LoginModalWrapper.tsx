import React, { useState, useEffect } from 'react';
import { UiModal } from './UiModal';
import { UiButton } from './UiButton';
import { UiInput } from './UiInput';
import { supabase } from '../../lib/supabase-browser';

export function LoginModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleShowLoginModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('show-login-modal', handleShowLoginModal);
    return () => window.removeEventListener('show-login-modal', handleShowLoginModal);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setIsOpen(false);
        setEmail('');
        setPassword('');
        // Recargar página para actualizar estado
        window.location.reload();
      }
    } catch (err) {
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <UiModal isOpen={isOpen} onClose={handleClose} variant="light">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-ink-inverse mb-6">
          Iniciar Sesión
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <UiInput
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            variant="light"
          />
          
          <UiInput
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="light"
          />
          
          {error && (
            <p className="text-state-danger text-sm">{error}</p>
          )}
          
          <div className="flex gap-3 pt-4">
            <UiButton
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </UiButton>
            
            <UiButton
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cancelar
            </UiButton>
          </div>
        </form>
      </div>
    </UiModal>
  );
}





