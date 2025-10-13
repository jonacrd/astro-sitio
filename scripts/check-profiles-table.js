#!/usr/bin/env node

/**
 * Script para verificar la estructura de la tabla profiles
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

async function checkProfilesTable() {
  console.log('🔍 Verificando estructura de la tabla profiles...\n');

  try {
    // Obtener una muestra de perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError.message);
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No hay perfiles en el sistema');
      return false;
    }

    console.log('📋 Estructura de la tabla profiles:');
    const profile = profiles[0];
    Object.keys(profile).forEach(key => {
      console.log(`   - ${key}: ${typeof profile[key]}`);
    });

    console.log('\n📄 Ejemplo de perfil:');
    console.log(JSON.stringify(profile, null, 2));

    return true;

  } catch (error) {
    console.error('❌ Error verificando tabla profiles:', error);
    return false;
  }
}

// Ejecutar
checkProfilesTable()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });










