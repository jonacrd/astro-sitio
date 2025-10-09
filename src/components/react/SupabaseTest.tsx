import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

export default function SupabaseTest() {
  const [status, setStatus] = useState('Verificando...');
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🔧 Probando conexión con Supabase...');
      
      // 1. Verificar sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('📱 Sesión actual:', sessionData.session);
      console.log('❌ Error sesión:', sessionError);
      
      // 2. Verificar usuarios en auth.users
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      console.log('👥 Usuarios en auth:', usersData);
      console.log('❌ Error usuarios:', usersError);
      
      // 3. Verificar perfiles en tabla profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);
      
      console.log('👤 Perfiles en BD:', profilesData);
      console.log('❌ Error perfiles:', profilesError);
      
      setUsers(usersData?.users || []);
      setProfiles(profilesData || []);
      
      if (sessionError || usersError || profilesError) {
        setStatus('❌ Error en conexión');
      } else {
        setStatus('✅ Conexión exitosa');
      }
      
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setStatus('❌ Error inesperado');
    }
  };

  const createTestUser = async () => {
    try {
      console.log('🧪 Creando usuario de prueba...');
      
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: 'Usuario Prueba',
            last_name: 'Test',
            address: 'Dirección de prueba'
          }
        }
      });
      
      if (error) {
        console.error('❌ Error creando usuario:', error);
        alert('Error: ' + error.message);
      } else {
        console.log('✅ Usuario creado:', data);
        alert('Usuario creado: ' + testEmail);
        testConnection(); // Refrescar datos
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      alert('Error inesperado');
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🧪 Test de Supabase</h3>
      
      <div className="mb-4">
        <p className="font-semibold">Estado: {status}</p>
      </div>
      
      <div className="mb-4">
        <button 
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          🔄 Verificar Conexión
        </button>
        
        <button 
          onClick={createTestUser}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          👤 Crear Usuario Prueba
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">👥 Usuarios Auth ({users.length})</h4>
          <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
            {users.map((user, index) => (
              <div key={index} className="text-sm mb-2 p-2 bg-gray-50 rounded">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Confirmado:</strong> {user.email_confirmed_at ? 'Sí' : 'No'}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">👤 Perfiles BD ({profiles.length})</h4>
          <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
            {profiles.map((profile, index) => (
              <div key={index} className="text-sm mb-2 p-2 bg-gray-50 rounded">
                <p><strong>Nombre:</strong> {profile.name}</p>
                <p><strong>ID:</strong> {profile.id}</p>
                <p><strong>Vendedor:</strong> {profile.is_seller ? 'Sí' : 'No'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}




