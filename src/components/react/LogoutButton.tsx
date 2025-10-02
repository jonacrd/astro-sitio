import React from 'react';
import { supabase } from '../../lib/supabase-browser';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className = '', children }: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error cerrando sesión:', error);
        alert('Error cerrando sesión. Intenta recargar la página.');
        return;
      }

      console.log('✅ Sesión cerrada exitosamente');
      
      // Disparar evento global para actualizar UI
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: null, type: 'logout' } 
      }));

      // Recargar página para limpiar estado
      window.location.reload();

    } catch (error) {
      console.error('❌ Error inesperado cerrando sesión:', error);
      alert('Error inesperado. Intenta recargar la página.');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`text-red-600 hover:text-red-800 transition-colors ${className}`}
    >
      {children || 'Cerrar Sesión'}
    </button>
  );
}



