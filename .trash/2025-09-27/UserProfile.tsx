import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface UserProfileProps {
  onLogout: () => void;
}

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export default function UserProfile({ onLogout }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        onLogout();
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [onLogout]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/60">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Extraer el primer nombre del email o usar el nombre completo si existe
  const getDisplayName = () => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0]; // Solo el primer nombre
    }
    // Si no hay nombre completo, extraer el nombre del email (antes del @)
    return user.email.split('@')[0].split('.')[0]; // Primera parte antes del punto
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
        <span className="text-primary font-bold text-sm">
          {getDisplayName()[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">
          {getDisplayName()}
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
        title="Cerrar sesión"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
      </button>
    </div>
  );
}