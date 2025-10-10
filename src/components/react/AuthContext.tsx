import React, { createContext, useContext, useState, useEffect } from 'react';
import GlobalAuthModal from './GlobalAuthModal';

interface AuthContextType {
  showLoginModal: (mode?: 'login' | 'register') => void;
  hideLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Escuchar eventos para mostrar modal
    const handleShowLoginModal = (event: CustomEvent) => {
      console.log('📢 Show login modal event received');
      setModalMode(event.detail?.mode || 'login');
      setShowModal(true);
    };

    window.addEventListener('show-login-modal', handleShowLoginModal as EventListener);

    return () => {
      window.removeEventListener('show-login-modal', handleShowLoginModal as EventListener);
    };
  }, []);

  const showLoginModal = (mode: 'login' | 'register' = 'login') => {
    console.log('🎬 Showing login modal:', mode);
    setModalMode(mode);
    setShowModal(true);
  };

  const hideLoginModal = () => {
    console.log('🚪 Hiding login modal');
    setShowModal(false);
  };

  const handleSuccess = () => {
    console.log('✅ Auth success, hiding modal');
    hideLoginModal();
  };

  return (
    <AuthContext.Provider value={{ showLoginModal, hideLoginModal }}>
      {children}
      <GlobalAuthModal
        isOpen={showModal}
        onClose={hideLoginModal}
        onSuccess={handleSuccess}
        initialMode={modalMode}
      />
    </AuthContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthProvider');
  }
  return context;
}








