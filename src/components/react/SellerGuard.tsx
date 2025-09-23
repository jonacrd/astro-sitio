import React, { useState, useEffect } from 'react';
import { getUser, getUserProfile } from '../../lib/session';

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
      const user = await getUser();
      
      if (!user) {
        console.log('❌ No hay usuario autenticado, redirigiendo...');
        window.location.href = '/';
        return;
      }

      const profile = await getUserProfile();

      if (!profile) {
        console.log('❌ No hay perfil, redirigiendo...');
        window.location.href = '/';
        return;
      }

      if (!profile.is_seller) {
        console.log('❌ Usuario no es vendedor, redirigiendo...');
        window.location.href = '/';
        return;
      }

      console.log('✅ Usuario es vendedor');
      setIsSeller(true);
    } catch (err: any) {
      console.error('❌ Error verificando vendedor:', err);
      setError('Error inesperado: ' + err.message);
      window.location.href = '/';
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
