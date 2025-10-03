import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

export default function UserChecker() {
  const [email, setEmail] = useState('jonacrd@gmail.com');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUser = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa un email');
      return;
    }

    setLoading(true);
    setError(null);
    setUser(null);
    setProfile(null);

    try {
      console.log('🔍 Buscando usuario:', email);
      
      // 1. Verificar si el usuario existe en auth.users
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error('❌ Error obteniendo usuarios:', usersError);
        setError('Error obteniendo usuarios: ' + usersError.message);
        return;
      }

      const foundUser = usersData?.users?.find(u => u.email === email);
      console.log('👤 Usuario encontrado en auth:', foundUser);
      setUser(foundUser);

      if (foundUser) {
        // 2. Verificar perfil en tabla profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', foundUser.id)
          .single();
        
        console.log('👤 Perfil encontrado:', profileData);
        console.log('❌ Error perfil:', profileError);
        setProfile(profileData);
      }

    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setError('Error inesperado: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa un email');
      return;
    }

    const password = prompt('Ingresa la contraseña para probar login:');
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Probando login con:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error en login:', error);
        setError('Error en login: ' + error.message);
      } else {
        console.log('✅ Login exitoso:', data);
        alert('¡Login exitoso! Usuario: ' + data.user?.email);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setError('Error inesperado: ' + error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  return (
    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
      <h3 className="text-lg font-bold mb-4 text-blue-800">🔍 Verificador de Usuario</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email a verificar:
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="usuario@email.com"
          />
          <button
            onClick={checkUser}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : '🔍 Buscar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ❌ {error}
        </div>
      )}

      {user && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <h4 className="font-semibold text-green-800 mb-2">✅ Usuario Encontrado en Auth</h4>
          <div className="text-sm space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Creado:</strong> {new Date(user.created_at).toLocaleString()}</p>
            <p><strong>Email confirmado:</strong> {user.email_confirmed_at ? 'Sí' : 'No'}</p>
            <p><strong>Último login:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nunca'}</p>
          </div>
          
          <div className="mt-3">
            <button
              onClick={testLogin}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              🔐 Probar Login
            </button>
          </div>
        </div>
      )}

      {!user && !loading && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          ⚠️ Usuario no encontrado en auth.users
        </div>
      )}

      {profile && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold text-blue-800 mb-2">👤 Perfil en Base de Datos</h4>
          <div className="text-sm space-y-1">
            <p><strong>Nombre:</strong> {profile.name}</p>
            <p><strong>Apellido:</strong> {profile.last_name || 'No especificado'}</p>
            <p><strong>Dirección:</strong> {profile.address || 'No especificada'}</p>
            <p><strong>Es vendedor:</strong> {profile.is_seller ? 'Sí' : 'No'}</p>
            <p><strong>Teléfono:</strong> {profile.phone || 'No especificado'}</p>
          </div>
        </div>
      )}

      {user && !profile && (
        <div className="mb-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded">
          ⚠️ Usuario existe en auth pero NO tiene perfil en BD
        </div>
      )}
    </div>
  );
}
