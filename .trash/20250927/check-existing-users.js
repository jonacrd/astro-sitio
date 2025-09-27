// Script para verificar usuarios existentes
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

async function checkExistingUsers() {
  try {
    console.log('🔍 Verificando usuarios existentes...');
    
    // Obtener usuarios existentes
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .limit(5);

    if (usersError) {
      console.log('❌ Error consultando usuarios:', usersError.message);
      return;
    }

    if (users && users.length > 0) {
      console.log('✅ Usuarios existentes encontrados:');
      users.forEach((user, index) => {
        console.log(`👤 Usuario ${index + 1}:`, {
          id: user.id,
          name: user.name,
          is_seller: user.is_seller
        });
      });
      
      // Usar el primer usuario como cliente
      const clientId = users[0].id;
      console.log(`🎯 Usando usuario ${clientId} como cliente`);
      
      // Buscar un vendedor
      const seller = users.find(u => u.is_seller);
      if (seller) {
        console.log(`🏪 Usando vendedor ${seller.id}: ${seller.name}`);
        return { clientId, sellerId: seller.id };
      } else {
        console.log('⚠️ No se encontró vendedor, usando el mismo usuario');
        return { clientId, sellerId: clientId };
      }
    } else {
      console.log('❌ No se encontraron usuarios existentes');
      return null;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

checkExistingUsers();

