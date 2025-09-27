// Script para crear un perfil de prueba
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

async function createTestProfile() {
  try {
    console.log('🔧 Creando perfil de prueba...');
    
    const testUserId = '550e8400-e29b-41d4-a716-446655440001';
    
    // Crear perfil de prueba
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'cliente@prueba.com',
        full_name: 'Cliente de Prueba',
        phone: '+56 9 1234 5678',
        address: 'Dirección de Prueba 123',
        city: 'Santiago',
        state: 'Región Metropolitana',
        zip_code: '12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      if (profileError.code === '23505') {
        console.log('✅ Perfil de prueba ya existe');
      } else {
        console.error('❌ Error creando perfil:', profileError);
        return;
      }
    } else {
      console.log('✅ Perfil de prueba creado:', profile);
    }
    
    // Crear vendedor de prueba
    const testSellerId = '550e8400-e29b-41d4-a716-446655440000';
    
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .insert({
        id: testSellerId,
        email: 'vendedor@prueba.com',
        full_name: 'Vendedor de Prueba',
        phone: '+56 9 8765 4321',
        address: 'Dirección del Vendedor 456',
        city: 'Santiago',
        state: 'Región Metropolitana',
        zip_code: '54321',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sellerError) {
      if (sellerError.code === '23505') {
        console.log('✅ Vendedor de prueba ya existe');
      } else {
        console.error('❌ Error creando vendedor:', sellerError);
        return;
      }
    } else {
      console.log('✅ Vendedor de prueba creado:', seller);
    }
    
    console.log('🎉 ¡Perfiles de prueba configurados!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestProfile();

