// Script para crear perfiles con la estructura correcta
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

async function createCorrectProfiles() {
  try {
    console.log('🔧 Creando perfiles con estructura correcta...');
    
    const testUserId = '550e8400-e29b-41d4-a716-446655440001';
    const testSellerId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Crear perfil de cliente
    const { data: clientProfile, error: clientError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        name: 'Cliente de Prueba',
        phone: '+56 9 1234 5678',
        is_seller: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (clientError) {
      if (clientError.code === '23505') {
        console.log('✅ Perfil de cliente ya existe');
      } else {
        console.error('❌ Error creando perfil de cliente:', clientError);
        return;
      }
    } else {
      console.log('✅ Perfil de cliente creado:', clientProfile);
    }
    
    // Crear perfil de vendedor
    const { data: sellerProfile, error: sellerError } = await supabase
      .from('profiles')
      .insert({
        id: testSellerId,
        name: 'Vendedor de Prueba',
        phone: '+56 9 8765 4321',
        is_seller: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sellerError) {
      if (sellerError.code === '23505') {
        console.log('✅ Perfil de vendedor ya existe');
      } else {
        console.error('❌ Error creando perfil de vendedor:', sellerError);
        return;
      }
    } else {
      console.log('✅ Perfil de vendedor creado:', sellerProfile);
    }
    
    console.log('🎉 ¡Perfiles creados correctamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCorrectProfiles();

