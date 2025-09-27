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

// Cliente con service role para actualizar perfil
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateToSeller() {
  try {
    console.log('🔧 Actualizando usuario a vendedor...');
    
    const testEmail = 'vendedor.1758940040761@gmail.com';
    const testPassword = 'password123';
    
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
    
    // Actualizar perfil a vendedor usando service role
    console.log('👤 Actualizando perfil a vendedor...');
    
    const { error: updateError } = await supabaseService
      .from('profiles')
      .update({ is_seller: true })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('❌ Error actualizando perfil:', updateError.message);
      return;
    }

    console.log('✅ Perfil actualizado a vendedor');
    
    // Verificar perfil actualizado
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, is_seller')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError.message);
    } else {
      console.log('👤 Perfil actualizado:', profile);
      
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
          .eq('seller_id', data.user.id)
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
        console.log('⚠️ El usuario sigue sin ser vendedor');
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

updateToSeller();

