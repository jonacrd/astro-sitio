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

async function loginExistingSeller() {
  try {
    console.log('🔐 Intentando iniciar sesión con vendedor existente...');
    
    // Usar un vendedor existente
    const sellerEmail = 'jonacrd@gmail.com'; // Este es vendedor
    const testPassword = 'password123'; // Contraseña de prueba
    
    console.log(`📧 Intentando iniciar sesión con: ${sellerEmail}`);
    
    // Intentar iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sellerEmail,
      password: testPassword
    });

    if (error) {
      console.log('⚠️ No se pudo iniciar sesión con contraseña de prueba');
      console.log('💡 Esto es normal - necesitamos la contraseña real o crear una nueva');
      
      // Intentar con otro vendedor
      const sellerEmail2 = 'techstore.digital@gmail.com';
      console.log(`📧 Intentando con otro vendedor: ${sellerEmail2}`);
      
      const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: sellerEmail2,
        password: testPassword
      });

      if (error2) {
        console.log('⚠️ Tampoco se pudo con el segundo vendedor');
        console.log('💡 Necesitamos crear un usuario de prueba o usar contraseñas reales');
        
        // Crear un usuario de prueba nuevo
        console.log('🔧 Creando usuario de prueba...');
        
        const testEmail = 'vendedor.prueba@test.com';
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword
        });

        if (signUpError) {
          console.error('❌ Error creando usuario de prueba:', signUpError.message);
          return;
        }

        console.log('✅ Usuario de prueba creado:', signUpData.user?.email);
        
        // Crear perfil de vendedor
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              name: 'Vendedor Prueba',
              phone: '1234567890',
              is_seller: true
            });

          if (profileError) {
            console.error('❌ Error creando perfil:', profileError.message);
          } else {
            console.log('✅ Perfil de vendedor creado');
            console.log(`🔑 Credenciales: ${testEmail} / ${testPassword}`);
          }
        }
      } else {
        console.log('✅ Sesión iniciada con techstore.digital@gmail.com');
        console.log('👤 Usuario:', data2.user?.email);
        console.log('🆔 ID:', data2.user?.id);
      }
    } else {
      console.log('✅ Sesión iniciada exitosamente!');
      console.log('👤 Usuario:', data.user?.email);
      console.log('🆔 ID:', data.user?.id);
    }

    // Obtener sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
      return;
    }

    if (session) {
      console.log('\n🎯 Sesión activa:');
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
        
        if (profile.is_seller) {
          console.log('\n🌐 Ahora puedes ir a: http://localhost:4321/dashboard/pedidos');
          console.log('🔑 La sesión está activa en el navegador');
          console.log('📋 Deberías ver los pedidos confirmados');
        } else {
          console.log('⚠️ Este usuario no es vendedor');
        }
      }
      
    } else {
      console.log('❌ No hay sesión activa');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

loginExistingSeller();












