#!/usr/bin/env node

/**
 * Script para crear un usuario de prueba para testing
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('👤 Creando usuario de prueba...\n');

  try {
    // Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Error creando usuario en auth:', authError.message);
      return false;
    }

    console.log('✅ Usuario creado en auth:', authData.user.id);

    // Crear perfil en profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: 'Usuario de Prueba',
        avatar_url: null,
        phone: '+56912345678',
        role: 'seller'
      })
      .select();

    if (profileError) {
      console.error('❌ Error creando perfil:', profileError.message);
      return false;
    }

    console.log('✅ Perfil creado:', profileData[0].name);

    console.log('\n🎉 Usuario de prueba creado exitosamente!');
    console.log(`📧 Email: test@example.com`);
    console.log(`🔑 Password: testpassword123`);
    console.log(`🆔 ID: ${authData.user.id}`);

    return authData.user.id;

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
    return false;
  }
}

// Ejecutar
createTestUser()
  .then(userId => {
    if (userId) {
      console.log('\n💡 Puedes usar este usuario para probar el sistema de historias');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });




