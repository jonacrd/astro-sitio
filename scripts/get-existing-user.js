#!/usr/bin/env node

/**
 * Script para obtener un usuario existente para testing
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

async function getExistingUser() {
  console.log('👤 Obteniendo usuario existente...\n');

  try {
    // Obtener usuarios existentes
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError.message);
      return false;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ No hay usuarios en el sistema');
      return false;
    }

    const user = users[0];
    console.log('✅ Usuario encontrado:', user.email);
    console.log('🆔 ID:', user.id);

    // Verificar que tiene perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('⚠️ Usuario sin perfil, creando...');
      
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.email?.split('@')[0] || 'Usuario',
          avatar_url: null,
          phone: '+56912345678',
          role: 'seller'
        })
        .select();

      if (newProfileError) {
        console.error('❌ Error creando perfil:', newProfileError.message);
        return false;
      }

      console.log('✅ Perfil creado:', newProfile[0].name);
    } else {
      console.log('✅ Perfil existente:', profile.name, `(${profile.role})`);
    }

    console.log('\n🎉 Usuario listo para testing!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 ID: ${user.id}`);

    return user.id;

  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    return false;
  }
}

// Ejecutar
getExistingUser()
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










