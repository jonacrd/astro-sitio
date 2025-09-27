// Script para verificar autenticación de usuario
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserAuth() {
  try {
    console.log('🔍 Verificando autenticación de usuarios...');
    
    // Verificar usuarios en auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error consultando usuarios auth:', authError.message);
    } else {
      console.log(`📊 Usuarios en auth.users: ${authUsers.users.length}`);
      authUsers.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Creado: ${new Date(user.created_at).toLocaleString('es-ES')}`);
        console.log('');
      });
    }

    // Verificar perfiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.log('❌ Error consultando perfiles:', profileError.message);
    } else {
      console.log(`📊 Perfiles en public.profiles: ${profiles.length}`);
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ID: ${profile.id}`);
        console.log(`     Nombre: ${profile.name}`);
        console.log(`     Teléfono: ${profile.phone}`);
        console.log(`     Es vendedor: ${profile.is_seller ? 'Sí' : 'No'}`);
        console.log(`     Creado: ${new Date(profile.created_at).toLocaleString('es-ES')}`);
        console.log('');
      });
    }

    // Verificar si hay vendedores
    const sellers = profiles?.filter(p => p.is_seller) || [];
    console.log(`🏪 Vendedores encontrados: ${sellers.length}`);
    sellers.forEach((seller, index) => {
      console.log(`  ${index + 1}. ${seller.name} (${seller.id})`);
    });

    if (sellers.length === 0) {
      console.log('⚠️ No hay vendedores en la base de datos');
      console.log('💡 Esto explica por qué SellerGuard redirige');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserAuth();

