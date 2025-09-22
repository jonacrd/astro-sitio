import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface SellerGuardProps {
  children: React.ReactNode;
}

export default function SellerGuard({ children }: SellerGuardProps) {
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/';
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', user.id)
        .single();

      if (error) {
        setError('Error al verificar perfil: ' + error.message);
        return;
      }

      if (!profile?.is_seller) {
        window.location.href = '/';
        return;
      }

      setIsSeller(true);
    } catch (err: any) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md max-w-md">
            <h3 className="font-semibold mb-2">Error de Acceso</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isSeller) {
    return null; // Se redirigirá automáticamente
  }

  return <>{children}</>;
}
