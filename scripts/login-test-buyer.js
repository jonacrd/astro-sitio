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

// Cliente con service role para confirmar email
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function loginTestBuyer() {
  try {
    console.log('🔐 Iniciando sesión con comprador de prueba...');
    
    const testEmail = 'comprador.1758941092948@gmail.com';
    const testPassword = 'password123';
    
    // Confirmar email primero
    console.log('📧 Confirmando email...');
    
    const { data: users, error: usersError } = await supabaseService.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error listando usuarios:', usersError.message);
      return;
    }

    const user = users.users.find(u => u.email === testEmail);
    
    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    if (!user.email_confirmed_at) {
      const { error: confirmError } = await supabaseService.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('❌ Error confirmando email:', confirmError.message);
        return;
      }

      console.log('✅ Email confirmado');
    } else {
      console.log('✅ Email ya estaba confirmado');
    }
    
    // Iniciar sesión
    console.log('🔐 Iniciando sesión...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.error('❌ Error iniciando sesión:', error.message);
      return;
    }

    console.log('✅ Sesión iniciada exitosamente!');
    console.log('👤 Usuario:', data.user?.email);
    console.log('🆔 ID:', data.user?.id);
    
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
        
        if (!profile.is_seller) {
          console.log('\n🌐 Ahora puedes ir a: http://localhost:4321/mis-pedidos');
          console.log('🔑 La sesión está activa en el navegador');
          console.log('📋 Deberías ver los pedidos en preparación');
          console.log('\n🔑 Credenciales para futuras sesiones:');
          console.log(`   Email: ${testEmail}`);
          console.log(`   Password: ${testPassword}`);
          
          // Verificar pedidos del comprador
          console.log('\n📋 Verificando pedidos del comprador...');
          
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, total_cents, status, created_at')
            .eq('user_id', session.user.id)
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
          console.log('⚠️ Este usuario es vendedor, no comprador');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

loginTestBuyer();












