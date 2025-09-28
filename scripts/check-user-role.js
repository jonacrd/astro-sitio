#!/usr/bin/env node

/**
 * Script para verificar el rol de un usuario
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

async function checkUserRole() {
  console.log('👤 Verificando roles de usuarios...\n');

  try {
    // Obtener todos los perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, is_seller, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError.message);
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No hay perfiles en el sistema');
      return false;
    }

    console.log('📋 Perfiles encontrados:');
    profiles.forEach((profile, index) => {
      const role = profile.is_seller ? 'seller' : 'buyer';
      console.log(`${index + 1}. ${profile.name || 'Sin nombre'} (${role}) - ${profile.id}`);
    });

    // Contar por rol
    const roleCounts = profiles.reduce((acc, profile) => {
      const role = profile.is_seller ? 'seller' : 'buyer';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Resumen por rol:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} usuarios`);
    });

    // Buscar vendedores
    const sellers = profiles.filter(p => p.is_seller);
    if (sellers.length > 0) {
      console.log('\n🛍️ Vendedores encontrados:');
      sellers.forEach(seller => {
        console.log(`   - ${seller.name} (${seller.id})`);
      });
    } else {
      console.log('\n⚠️ No hay vendedores en el sistema');
      console.log('💡 Para crear un vendedor:');
      console.log('   1. Inicia sesión en tu aplicación');
      console.log('   2. Ve a tu perfil');
      console.log('   3. Cambia tu rol a "vendedor"');
    }

    return true;

  } catch (error) {
    console.error('❌ Error verificando roles:', error);
    return false;
  }
}

// Ejecutar
checkUserRole()
  .then(success => {
    if (success) {
      console.log('\n💡 Para probar el sistema de historias:');
      console.log('   1. Asegúrate de estar logueado como vendedor');
      console.log('   2. Recarga la página');
      console.log('   3. Deberías ver el botón "Crear Historia"');
      console.log('   4. Haz click para subir tu primera historia');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
