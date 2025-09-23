import React, { useState, useEffect } from 'react';
import { getUser, getUserProfile } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

interface CompleteProfileProps {
  onComplete: () => void;
}

export default function CompleteProfile({ onComplete }: CompleteProfileProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar datos del perfil existente al montar
  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await getUser();
        if (!user) {
          setError('No hay usuario autenticado');
          return;
        }

        const profile = await getUserProfile();
        if (profile) {
          setName(profile.name || '');
          setPhone(profile.phone || '');
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setIsInitialized(true);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Verificando autenticación...');
      const user = await getUser();
      
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        setError('No hay usuario autenticado. Por favor inicia sesión primero.');
        return;
      }

      console.log('✅ Usuario autenticado:', user.email);

      console.log('💾 Guardando perfil...');
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        name: name.trim(),
        phone: phone.trim()
      }, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error al guardar perfil:', error);
        setError('Error al guardar perfil: ' + error.message);
        return;
      }

      console.log('✅ Perfil guardado exitosamente');
      alert('¡Perfil completado exitosamente!');
      onComplete();
    } catch (err: any) {
      console.error('❌ Error inesperado:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Completar Perfil
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre completo"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            placeholder="+56 9 1234 5678"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Completar Perfil'}
        </button>
      </form>
    </div>
  );
}
