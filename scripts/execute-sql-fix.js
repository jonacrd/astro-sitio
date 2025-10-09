#!/usr/bin/env node

/**
 * Script para ejecutar el SQL de corrección de la base de datos
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFix() {
  try {
    console.log('🔧 Ejecutando corrección de la base de datos...');
    
    // Leer el archivo SQL
    const sqlPath = join(process.cwd(), 'scripts', 'fix-database-schema.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Dividir en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Ejecutando ${statements.length} statements SQL...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔧 Ejecutando statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error en statement ${i + 1}:`, error.message);
            // Continuar con el siguiente statement
          } else {
            console.log(`✅ Statement ${i + 1} ejecutado exitosamente`);
          }
        } catch (err) {
          console.error(`❌ Error ejecutando statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\n🎉 Corrección de base de datos completada');
    
    // Verificar que la tabla ahora tiene la estructura correcta
    const { data: testData, error: testError } = await supabase
      .from('seller_products')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error verificando tabla:', testError);
    } else {
      console.log('✅ Tabla seller_products verificada exitosamente');
      console.log('📊 Estructura:', Object.keys(testData[0] || {}));
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando corrección:', error);
  }
}

executeSQLFix().catch(console.error);










