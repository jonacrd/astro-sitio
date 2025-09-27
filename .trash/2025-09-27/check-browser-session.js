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

async function checkBrowserSession() {
  try {
    console.log('🔍 Verificando sesión en el navegador...');
    
    // Verificar sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
      return;
    }

    if (session) {
      console.log('✅ Sesión activa encontrada:');
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
        
        // Verificar pedidos
        console.log('\n📋 Verificando pedidos del usuario...');
        
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
      }
    } else {
      console.log('❌ No hay sesión activa en el navegador');
      console.log('💡 Necesitas iniciar sesión primero');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkBrowserSession();

