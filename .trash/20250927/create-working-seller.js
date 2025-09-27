import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

// Cliente normal para auth
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente con service role para crear perfiles
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createWorkingSeller() {
  try {
    console.log('🔧 Creando usuario vendedor funcional...');
    
    // Usar un email válido y único
    const timestamp = Date.now();
    const testEmail = `vendedor.${timestamp}@gmail.com`;
    const testPassword = 'password123';
    
    console.log(`📧 Creando usuario: ${testEmail}`);
    
    // Crear usuario
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError) {
      console.error('❌ Error creando usuario:', signUpError.message);
      return;
    }

    console.log('✅ Usuario creado:', signUpData.user?.email);
    
    if (signUpData.user) {
      // Crear perfil de vendedor usando service role
      console.log('👤 Creando perfil de vendedor...');
      
      const { error: profileError } = await supabaseService
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          name: 'Vendedor Test',
          phone: '1234567890',
          is_seller: true
        });

      if (profileError) {
        console.error('❌ Error creando perfil:', profileError.message);
        return;
      }

      console.log('✅ Perfil de vendedor creado');
      
      // Confirmar email usando service role
      console.log('📧 Confirmando email...');
      
      const { error: confirmError } = await supabaseService.auth.admin.updateUserById(
        signUpData.user.id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('❌ Error confirmando email:', confirmError.message);
        return;
      }

      console.log('✅ Email confirmado');
      
      // Intentar iniciar sesión
      console.log('🔐 Iniciando sesión...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (signInError) {
        console.error('❌ Error iniciando sesión:', signInError.message);
        return;
      }

      console.log('✅ Sesión iniciada exitosamente!');
      console.log('👤 Usuario:', signInData.user?.email);
      console.log('🆔 ID:', signInData.user?.id);
      
      // Verificar sesión
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
            console.log('\n🔑 Credenciales para futuras sesiones:');
            console.log(`   Email: ${testEmail}`);
            console.log(`   Password: ${testPassword}`);
            
            // Verificar pedidos del vendedor
            console.log('\n📋 Verificando pedidos del vendedor...');
            
            const { data: orders, error: ordersError } = await supabase
              .from('orders')
              .select('id, total_cents, status, created_at')
              .eq('seller_id', session.user.id)
              .order('created_at', { ascending: false });

            if (ordersError) {
              console.error('❌ Error obteniendo pedidos:', ordersError.message);
            } else {
              console.log(`📊 Pedidos encontrados: ${orders.length}`);
              orders.forEach((order, index) => {
                console.log(`   ${index + 1}. ID: ${order.id.substring(0, 8)}... Estado: ${order.status} Total: $${(order.total_cents / 100).toFixed(2)}`);
              });
            }
          } else {
            console.log('⚠️ Este usuario no es vendedor');
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createWorkingSeller();

