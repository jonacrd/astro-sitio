#!/usr/bin/env node

/**
 * Script para crear el sistema de recompensas
 * Ejecutar con: node scripts/create-rewards-system.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log('🎁 Creando sistema de recompensas...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, 'create-rewards-system.sql');
    if (!existsSync(sqlPath)) {
      console.error('❌ Archivo create-rewards-system.sql no encontrado');
      process.exit(1);
    }

    const sql = readFileSync(sqlPath, 'utf8');
    console.log('📄 Ejecutando script SQL...');

    // Dividir el SQL en statements individuales
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Ejecutando ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Ejecutando statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Error en statement ${i + 1}:`, error.message);
            // Continuar con el siguiente statement
          } else {
            console.log(`✅ Statement ${i + 1} ejecutado exitosamente`);
          }
        } catch (err) {
          console.warn(`⚠️  Error ejecutando statement ${i + 1}:`, err.message);
          // Continuar con el siguiente statement
        }
      }
    }

    console.log('\n🎉 Sistema de recompensas creado exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ve a /dashboard/recompensas para configurar tu sistema');
    console.log('2. Activa el sistema de puntos para tu tienda');
    console.log('3. Configura los niveles de recompensa');
    console.log('4. Los clientes podrán ganar puntos en compras de $5,000+');

  } catch (error) {
    console.error('❌ Error creando sistema de recompensas:', error);
    process.exit(1);
  }
}

main().catch(console.error);
