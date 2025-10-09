#!/usr/bin/env node

/**
 * Script para configurar la base de datos automáticamente
 * Se ejecuta al hacer deploy o cuando sea necesario
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Configurando base de datos automáticamente...');

  try {
    // Leer el script SQL
    const sqlPath = join(__dirname, 'create-essential-tables.sql');
    if (!existsSync(sqlPath)) {
      console.error('❌ Archivo create-essential-tables.sql no encontrado');
      process.exit(1);
    }

    const sql = readFileSync(sqlPath, 'utf8');
    
    // Dividir el script en statements individuales
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} statements...`);

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Ejecutando statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Warning en statement ${i + 1}:`, error.message);
            // Continuar con el siguiente statement
          } else {
            console.log(`✅ Statement ${i + 1} ejecutado exitosamente`);
          }
        } catch (err) {
          console.warn(`⚠️  Error en statement ${i + 1}:`, err.message);
          // Continuar con el siguiente statement
        }
      }
    }

    console.log('✅ Base de datos configurada exitosamente');
    
    // Verificar que las tablas existen
    console.log('🔍 Verificando tablas...');
    
    const tables = ['notifications', 'user_points'];
    const views = ['seller_orders_dashboard', 'buyer_notifications', 'user_points_summary'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.code !== 'PGRST116') {
          console.log(`❌ ${table}: NO EXISTE`);
        } else {
          console.log(`✅ ${table}: EXISTE`);
        }
      } catch (err) {
        console.log(`❌ ${table}: NO EXISTE`);
      }
    }

    console.log('🎉 ¡Configuración completada!');
    
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };










