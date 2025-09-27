import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

// Usar service role para acceder a auth.users
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthUsers() {
  try {
    console.log('🔍 Verificando usuarios en auth.users...');
    
    // Listar usuarios de auth
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error listando usuarios:', error.message);
      return;
    }

    console.log(`📊 Total de usuarios en auth: ${users.users.length}`);
    
    users.users.forEach((user, index) => {
      console.log(`👤 Usuario ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Creado: ${new Date(user.created_at).toLocaleString('es-ES')}`);
      console.log(`   Último acceso: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-ES') : 'Nunca'}`);
      console.log('');
    });

    // Verificar perfiles correspondientes
    console.log('🔍 Verificando perfiles correspondientes...');
    
    for (const user of users.users) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, is_seller')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error(`❌ Error obteniendo perfil para ${user.email}:`, profileError.message);
      } else if (profile) {
        console.log(`✅ Perfil encontrado para ${user.email}:`, profile);
      } else {
        console.log(`⚠️ No hay perfil para ${user.email}`);
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkAuthUsers();

