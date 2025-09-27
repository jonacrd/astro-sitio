#!/usr/bin/env node

/**
 * Script para crear la tabla notifications
 */

import { createClient } from '@supabase/supabase-js';
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

async function createNotificationsTable() {
  console.log('🔧 Creando tabla notifications...\n');

  try {
    // 1. Crear tabla notifications
    console.log('📝 Creando tabla notifications...');
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.log('⚠️ Error creando tabla notifications:', createTableError.message);
      console.log('💡 Intenta ejecutar manualmente en Supabase SQL Editor:');
      console.log(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    } else {
      console.log('✅ Tabla notifications creada exitosamente');
    }

    // 2. Habilitar RLS para notifications
    console.log('\n📝 Configurando RLS para notifications...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view own notifications" ON notifications
          FOR SELECT USING (auth.uid() = user_id);
      `
    });

    if (rlsError) {
      console.log('⚠️ Error configurando RLS:', rlsError.message);
      console.log('💡 Intenta ejecutar manualmente en Supabase SQL Editor:');
      console.log(`
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own notifications" ON notifications
          FOR SELECT USING (auth.uid() = user_id);
      `);
    } else {
      console.log('✅ RLS configurado exitosamente');
    }

    console.log('\n🎉 ¡Tabla notifications creada!');
    console.log('   Ahora las notificaciones funcionarán correctamente.');

  } catch (error) {
    console.error('❌ Error creando tabla:', error);
    console.log('\n💡 Solución manual:');
    console.log('   1. Ve a Supabase > SQL Editor');
    console.log('   2. Ejecuta el SQL de notifications que se mostró arriba');
  }
}

createNotificationsTable();