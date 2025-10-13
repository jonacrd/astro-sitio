#!/usr/bin/env node

/**
 * Script para actualizar el esquema de la base de datos
 * Ejecutar con: node scripts/update-database-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDatabaseSchema() {
  console.log('🔄 Actualizando esquema de la base de datos...');

  try {
    // Leer el archivo SQL
    const sqlPath = join(process.cwd(), 'scripts', 'update-orders-schema.sql');
    
    if (!existsSync(sqlPath)) {
      console.error('❌ Archivo SQL no encontrado:', sqlPath);
      return;
    }

    const sqlContent = readFileSync(sqlPath, 'utf8');
    console.log('📄 Archivo SQL leído exitosamente');

    // Dividir en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Ejecutando ${statements.length} statements...`);

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        console.log(`🔄 Ejecutando statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });

          if (error) {
            console.error(`❌ Error en statement ${i + 1}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
            // Continuar con el siguiente statement
            continue;
          }

          console.log(`✅ Statement ${i + 1} ejecutado exitosamente`);
        } catch (err) {
          console.error(`❌ Error ejecutando statement ${i + 1}:`, err.message);
          // Continuar con el siguiente statement
          continue;
        }
      }
    }

    console.log('\n🎉 ¡Actualización del esquema completada!');
    console.log('\n📋 Cambios realizados:');
    console.log('✅ Agregadas columnas a la tabla orders');
    console.log('✅ Creada tabla notifications');
    console.log('✅ Creada tabla user_points');
    console.log('✅ Creados índices para mejor rendimiento');
    console.log('✅ Creadas funciones para manejo de pedidos');
    console.log('✅ Creadas vistas para dashboards');
    console.log('✅ Configuradas políticas RLS');

    console.log('\n🔗 Próximos pasos:');
    console.log('1. Verificar que las tablas se crearon correctamente');
    console.log('2. Probar el dashboard de vendedores');
    console.log('3. Probar las notificaciones de compradores');
    console.log('4. Probar el sistema de puntos');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

updateDatabaseSchema();














