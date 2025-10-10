import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function loginAsSeller() {
  try {
    console.log('🔐 Intentando iniciar sesión como vendedor...');
    
    // Usar un email de prueba (necesitamos crear un usuario de prueba)
    const testEmail = 'vendedor@test.com';
    const testPassword = 'password123';
    
    // Intentar iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.log('⚠️ No se pudo iniciar sesión, creando usuario de prueba...');
      
      // Crear usuario de prueba
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      if (signUpError) {
        console.error('❌ Error creando usuario:', signUpError.message);
        return;
      }

      console.log('✅ Usuario creado:', signUpData.user?.email);
      
      // Crear perfil de vendedor
      if (signUpData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            name: 'Vendedor Test',
            phone: '1234567890',
            is_seller: true
          });

        if (profileError) {
          console.error('❌ Error creando perfil:', profileError.message);
        } else {
          console.log('✅ Perfil de vendedor creado');
        }
      }
    } else {
      console.log('✅ Sesión iniciada:', data.user?.email);
    }

    // Obtener sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
      return;
    }

    if (session) {
      console.log('🎯 Sesión activa:');
      console.log('   Usuario:', session.user.email);
      console.log('   ID:', session.user.id);
      console.log('   Token:', session.access_token.substring(0, 20) + '...');
      
      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, is_seller')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ Error obteniendo perfil:', profileError.message);
      } else {
        console.log('👤 Perfil:', profile);
      }
      
      console.log('\n🌐 Ahora puedes ir a: http://localhost:4321/dashboard/pedidos');
      console.log('🔑 La sesión está activa en el navegador');
      
    } else {
      console.log('❌ No hay sesión activa');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

loginAsSeller();










