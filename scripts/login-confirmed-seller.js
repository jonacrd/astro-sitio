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

async function loginConfirmedSeller() {
  try {
    console.log('🔐 Intentando iniciar sesión con vendedores confirmados...');
    
    // Lista de vendedores que sabemos que existen
    const sellers = [
      { email: 'jonacrd@gmail.com', password: 'password123' },
      { email: 'techstore.digital@gmail.com', password: 'password123' },
      { email: 'minimarket.la.esquina@gmail.com', password: 'password123' },
      { email: 'sofia@test.com', password: 'password123' },
      { email: 'luis@test.com', password: 'password123' },
      { email: 'ana@test.com', password: 'password123' }
    ];
    
    for (const seller of sellers) {
      console.log(`📧 Intentando con: ${seller.email}`);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: seller.email,
          password: seller.password
        });

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          continue;
        }

        console.log('✅ Sesión iniciada exitosamente!');
        console.log('👤 Usuario:', data.user?.email);
        console.log('🆔 ID:', data.user?.id);
        
        // Verificar sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError.message);
          continue;
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
            continue;
          }

          console.log('👤 Perfil:', profile);
          
          if (profile.is_seller) {
            console.log('\n🌐 Ahora puedes ir a: http://localhost:4321/dashboard/pedidos');
            console.log('🔑 La sesión está activa en el navegador');
            console.log('📋 Deberías ver los pedidos confirmados');
            console.log('\n🔑 Credenciales para futuras sesiones:');
            console.log(`   Email: ${seller.email}`);
            console.log(`   Password: ${seller.password}`);
            
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
            
            return; // Salir si encontramos un vendedor válido
          } else {
            console.log('⚠️ Este usuario no es vendedor');
          }
        }
      } catch (err) {
        console.log(`   ❌ Error inesperado: ${err.message}`);
        continue;
      }
    }
    
    console.log('\n❌ No se pudo iniciar sesión con ningún vendedor');
    console.log('💡 Necesitamos las contraseñas reales o crear un nuevo usuario');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

loginConfirmedSeller();



