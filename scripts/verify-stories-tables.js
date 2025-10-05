#!/usr/bin/env node

/**
 * Script rápido para verificar que las tablas de historias existen
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

async function verifyTables() {
  console.log('🔍 Verificando tablas de historias...\n');

  const tables = [
    'express_posts',
    'stories', 
    'story_views',
    'story_reactions',
    'story_replies',
    'express_media',
    'express_reactions'
  ];

  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Tabla ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ Tabla ${table}: OK`);
      }
    } catch (err) {
      console.error(`❌ Tabla ${table}: ${err.message}`);
      allTablesExist = false;
    }
  }

  if (allTablesExist) {
    console.log('\n🎉 ¡Todas las tablas existen! El sistema de historias está listo.');
  } else {
    console.log('\n⚠️ Algunas tablas no existen. Ejecuta el script setup-complete-stories.sql en Supabase SQL Editor.');
  }

  return allTablesExist;
}

verifyTables()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });





