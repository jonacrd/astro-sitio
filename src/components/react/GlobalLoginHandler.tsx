import React, { useState, useEffect } from 'react';
import FixedLoginModal from './FixedLoginModal';

export default function GlobalLoginHandler() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  console.log('🚀 GlobalLoginHandler montado, modal abierto:', isModalOpen);

  useEffect(() => {
    const handleShowLoginModal = () => {
      console.log('🔐 Evento show-login-modal recibido, abriendo modal');
      setIsModalOpen(true);
    };

    console.log('🎧 GlobalLoginHandler: Escuchando evento show-login-modal');
    
    // Escuchar el evento show-login-modal
    window.addEventListener('show-login-modal', handleShowLoginModal);

    return () => {
      console.log('🎧 GlobalLoginHandler: Removiendo listener');
      window.removeEventListener('show-login-modal', handleShowLoginModal);
    };
  }, []);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleLoginSuccess = (user: any) => {
    console.log('✅ Login exitoso desde GlobalLoginHandler:', user.email);
    setIsModalOpen(false);
    
    // Disparar evento de autenticación exitosa
    window.dispatchEvent(new CustomEvent('auth-state-changed', { 
      detail: { user, authenticated: true } 
    }));
    
    // Mostrar notificación de éxito
    window.dispatchEvent(new CustomEvent('show-notification', {
      detail: {
        type: 'success',
        title: '¡Bienvenido!',
        message: `Hola ${user.email}, ya puedes proceder al pago.`
      }
    }));
  };

  return (
    <FixedLoginModal
      isOpen={isModalOpen}
      onClose={handleClose}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
